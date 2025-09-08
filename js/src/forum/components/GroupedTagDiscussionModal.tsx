import app from 'flarum/forum/app';
import classList from 'flarum/common/utils/classList';
import highlight from 'flarum/common/helpers/highlight';
import LoadingIndicator from 'flarum/common/components/LoadingIndicator';

// 直接复用 flarum/tags 的讨论弹窗（其中已经实现了 limits、父子要求、提交保存、可选标签等）
// 我们只重写内容渲染，把列表按“标签分类组”分节
import TagDiscussionModal, { type TagDiscussionModalAttrs } from 'flarum/tags/forum/components/TagDiscussionModal';

// 复用 tags 的工具和视觉渲染
import tagIcon from 'flarum/tags/common/helpers/tagIcon';
import sortTags from 'flarum/tags/common/utils/sortTags';
import type Tag from 'flarum/tags/common/models/Tag';

type Vnode = Mithril.Vnode<TagDiscussionModalAttrs, GroupedTagDiscussionModal>;

// 与后端 ForumSerializer 对应的结构
interface ForumTagCategory {
  id: number;
  name: string;
  slug: string | null;
  order: number | null;
  tagIds: number[];
}

/**
 * 分组版标签讨论弹窗：
 * - 继承 TagDiscussionModal，保留它的 limits/canSelect/提交 等逻辑
 * - 仅覆盖 content()，将可选标签按 Forum 载荷中的 tagCategories 分节展示
 * - 若没有任何分类组（或过滤后分组全空），自动回退到父类渲染
 */
export default class GroupedTagDiscussionModal extends TagDiscussionModal<TagDiscussionModalAttrs> {
  view(vnode: Vnode) {
    // 直接沿用父类的 Modal 结构（标题、搜索框等都在 content() 内）
    return super.view(vnode);
  }

  // 只覆盖内容渲染
  content() {
    // 还在异步加载所有 tag 期间，沿用父类加载态
    // 父类中 this.loading 在 tags 未就绪时为 true
    // @ts-ignore protected in parent; we rely on inherited behavior
    if (this.loading) {
      return <LoadingIndicator />;
    }

    // --- 基础数据准备（复用父类状态与 attrs） ---
    // 可选标签集合：沿用父类 props/约束
    const selectable: Tag[] =
      (this.attrs.selectableTags ? this.attrs.selectableTags() : (this as any).tags) || [];

    // 过滤关键字（沿用父类的 Stream）
    // @ts-ignore
    const filter: string = this.filter?.() || '';

    // 仅保留满足 canSelect 的标签（父类也会在 toggle 时再次校验）
    const canSelect = this.attrs.canSelect || (() => true);
    const visible = selectable.filter((t) => canSelect(t));

    // 应用关键字过滤（对名称与描述做简单高亮过滤，逻辑与父类一致）
    const filtered = visible.filter((tag) => {
      if (!filter) return true;
      const text = `${tag.name()} ${tag.description() || ''}`.toLowerCase();
      return text.includes(filter.toLowerCase());
    });

    // 若没有任何分组数据，或过滤后所有分组都为空，回退到父类渲染
    const categories: ForumTagCategory[] = (app.forum.attribute('tagCategories') as ForumTagCategory[]) || [];
    const id2tag = new Map<number, Tag>(filtered.map((t) => [t.id() as number, t]));

    // 构造分组：按 order 排序；每组内按 tags 的 sortTags 进行排序
    const grouped = categories
      .map((g) => {
        const list = (g.tagIds || []).map((id) => id2tag.get(id)).filter(Boolean) as Tag[];
        return { group: g, tags: sortTags(list.slice()) };
      })
      .filter((entry) => entry.tags.length > 0);

    // 计算“未分组”：过滤后可见、但不在任何分组 tagIds 里的标签
    const groupedIdSet = new Set<number>();
    grouped.forEach((e) => e.tags.forEach((t) => groupedIdSet.add(t.id() as number)));
    const ungrouped = sortTags(filtered.filter((t) => !groupedIdSet.has(t.id() as number)));

    // 若完全没有可显示的分节（且未分组也为空）→ 回退父类
    if (!grouped.length && !ungrouped.length) {
      return super.content();
    }

    // --- 渲染头部（保留父类行为：标题、搜索框、提交/重置等） ---
    // 由于父类 content() 内部包含大量结构，我们只重建最小必要结构：
    // 1) 标题行 + 搜索输入
    // 2) 分组列表
    // 3) 底部 bypass 限制开关（沿用 attrs.limits.allowBypassing 的行为）
    return (
      <div className="Modal-content TagSelectionModal lbtc-GroupedTagSelection">
        {/* Header 区域：沿用父类的交互（搜索、重置、提交），这里做最小还原 */}
        <div className="Modal-header">
          <h3 className="App-titleControl App-titleControl--text">{this.attrs.title}</h3>
          {/* 搜索框：直接复用父类的 this.filter Stream */}
          <input
            className="FormControl"
            placeholder={app.translator.trans('flarum-tags.lib.tag_selection_modal.search_placeholder')}
            // @ts-ignore
            value={this.filter?.()}
            // @ts-ignore
            oninput={(e: any) => this.filter?.(e.target.value)}
          />
          <div className="ButtonGroup">
            {this.attrs.allowResetting && (this as any).selected?.length ? (
              <button className="Button" onclick={() => (this as any).deselectAll()}>
                {app.translator.trans('flarum-tags.lib.tag_selection_modal.reset_button')}
              </button>
            ) : null}
            <button className="Button Button--primary" onclick={() => this.onsubmit()}>
              {app.translator.trans('flarum-tags.lib.tag_selection_modal.submit_button')}
            </button>
          </div>
        </div>

        {/* Body：分组节列表 */}
        <div className="Modal-body">
          {/* 已分组 */}
          {grouped.map(({ group, tags }) => (
            <div className="lbtc-GroupSection">
              <div className="lbtc-GroupSection-title">{group.name}</div>
              <ul className="TagSelectionModal-list SelectTagList">
                {tags.map((tag) => this.renderTagItem(tag, filter))}
              </ul>
            </div>
          ))}

          {/* 未分组 */}
          {ungrouped.length ? (
            <div className="lbtc-GroupSection">
              <div className="lbtc-GroupSection-title">
                {app.translator.trans('lady-byron-tag-categories.forum.tag_selection.ungrouped')}
              </div>
              <ul className="TagSelectionModal-list SelectTagList">
                {ungrouped.map((tag) => this.renderTagItem(tag, filter))}
              </ul>
            </div>
          ) : null}

          {/* 底部：允许 bypass 限制的开关 */}
          {this.attrs.limits?.allowBypassing ? (
            <div className="TagSelectionModal-bypass">
              {/* @ts-ignore */}
              <label class="checkbox">
                {/* @ts-ignore */}
                <input type="checkbox" checked={this.bypassReqs} onchange={() => ((this as any).bypassReqs = !(this as any).bypassReqs)} />
                {app.translator.trans('flarum-tags.lib.tag_selection_modal.bypass_requirements')}
              </label>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  /** 渲染单个标签项：复用 flarum/tags 的 class 命名与交互 */
  private renderTagItem(tag: Tag, filter: string) {
    // @ts-ignore inherited selected/indexTag
    const active = this.indexTag === tag;
    // @ts-ignore inherited selected
    const selected = (this as any).selected.includes(tag);

    return (
      <li
        data-index={tag.id()}
        className={classList('SelectTagListItem', {
          pinned: tag.position() !== null,
          child: !!tag.parent(),
          colored: !!tag.color(),
          selected,
          active,
        })}
        style={{ color: tag.color() || undefined }}
        onmouseover={() => ((this as any).indexTag = tag)}
        onclick={() => (this as any).toggleTag(tag)}
      >
        {tagIcon(tag)}
        <span className="SelectTagListItem-name">{highlight(tag.name(), filter)}</span>
        {tag.description() ? <span className="SelectTagListItem-description">{tag.description()}</span> : null}
      </li>
    );
  }
}
