import app from 'flarum/forum/app';
import classList from 'flarum/common/utils/classList';
import highlight from 'flarum/common/helpers/highlight';
import LoadingIndicator from 'flarum/common/components/LoadingIndicator';

import TagDiscussionModal, { type TagDiscussionModalAttrs } from 'flarum/tags/forum/components/TagDiscussionModal';
import tagIcon from 'flarum/tags/common/helpers/tagIcon';
import sortTags from 'flarum/tags/common/utils/sortTags';
import type Tag from 'flarum/tags/common/models/Tag';

type Vnode = Mithril.Vnode<TagDiscussionModalAttrs, GroupedTagDiscussionModal>;

interface ForumTagCategory {
  id: number;
  name: string;
  slug: string | null;
  order: number | null;
  tagIds: number[];
}

export default class GroupedTagDiscussionModal extends TagDiscussionModal<TagDiscussionModalAttrs> {
  view(vnode: Vnode) {
    // 保持父类的外层 view（会包含 Modal 的骨架并调用 content()）
    return super.view(vnode);
  }

  content() {
    // 父类在 tags 未就绪时会置 this.loading
    // @ts-ignore
    if (this.loading) return <LoadingIndicator />;

    // ========== 1) 取得“可见可选”的标签集合 ==========
    // 父类在 oninit 里会准备 this.tags（全部可选标签）
    // 如果经由 TagSelectionModal 场景传递了 selectableTags() 则以那个为准
    // @ts-ignore
    const base: Tag[] = this.attrs.selectableTags ? this.attrs.selectableTags() : (this.tags as Tag[] | undefined) || [];
    const canSelect = this.attrs.canSelect || (() => true);
    const selectable = base.filter((t) => canSelect(t));

    // 搜索关键字（父类维护的 Stream）
    // @ts-ignore
    const filter: string = (this.filter && this.filter()) || '';

    const filtered: Tag[] = !filter
      ? selectable
      : selectable.filter((tag) => {
          const text = `${tag.name() || ''} ${tag.description() || ''}`.toLowerCase();
          return text.includes(filter.toLowerCase());
        });

    // ========== 2) 在“过滤后可见标签”里做分组 ==========
    const categories: ForumTagCategory[] = ((app.forum.attribute('tagCategories') as ForumTagCategory[]) || []).slice();

    // 排序：order 越小越靠前，然后按 id 兜底
    categories.sort((a, b) => (a.order ?? 99999) - (b.order ?? 99999) || a.id - b.id);

    const id2tag = new Map<number, Tag>(filtered.map((t) => [t.id() as number, t]));

    const grouped = categories
      .map((g) => {
        const list = (g.tagIds || []).map((id) => id2tag.get(id)).filter(Boolean) as Tag[];
        return { g, tags: sortTags(list) };
      })
      .filter((e) => e.tags.length > 0);

    const groupedIdSet = new Set<number>();
    grouped.forEach((e) => e.tags.forEach((t) => groupedIdSet.add(t.id() as number)));

    const ungrouped = sortTags(filtered.filter((t) => !groupedIdSet.has(t.id() as number)));

    // 如果没有任何分组且未分组为空，退回父类原始渲染
    if (!grouped.length && !ungrouped.length) {
      return super.content();
    }

    // ========== 3) 渲染（保持与原生 TagSelectionModal 接近的结构/类名） ==========
    const ph = app.translator.trans('flarum-tags.lib.tag_selection_modal.search_placeholder');

    return (
      <div className="TagSelectionModal">
        {/* 工具栏：搜索 + 重置 + 提交 */}
        <div className="Form-group TagSelectionModal-toolbar">
          <input
            className="FormControl"
            placeholder={ph}
            // @ts-ignore
            value={this.filter ? this.filter() : ''}
            // @ts-ignore
            oninput={(e: any) => this.filter && this.filter(e.target.value)}
          />

          <div className="ButtonGroup">
            {/* @ts-ignore */}
            {this.attrs.allowResetting && this.selected?.length ? (
              // @ts-ignore
              <button className="Button" onclick={() => this.deselectAll()}>
                {app.translator.trans('flarum-tags.lib.tag_selection_modal.reset_button')}
              </button>
            ) : null}

            <button className="Button Button--primary" onclick={() => this.onsubmit()}>
              {app.translator.trans('flarum-tags.lib.tag_selection_modal.submit_button')}
            </button>
          </div>
        </div>

        {/* 各分类组 */}
        {grouped.map(({ g, tags }) => (
          <div className="Form-group lbtc-GroupSection" key={g.id}>
            <div className="lbtc-GroupSection-title">{g.name}</div>
            <ul className="TagSelectionModal-list SelectTagList">{tags.map((t) => this.renderTagItem(t, filter))}</ul>
          </div>
        ))}

        {/* 未分组 */}
        {ungrouped.length ? (
          <div className="Form-group lbtc-GroupSection lbtc-GroupSection--ungrouped">
            <div className="lbtc-GroupSection-title">
              {app.translator.trans('lady-byron-tag-categories.forum.tag_selection.ungrouped')}
            </div>
            <ul className="TagSelectionModal-list SelectTagList">{ungrouped.map((t) => this.renderTagItem(t, filter))}</ul>
          </div>
        ) : null}

        {/* 允许越过限制的开关（与原生一致） */}
        {this.attrs.limits?.allowBypassing ? (
          <div className="Form-group TagSelectionModal-bypass">
            <label className="checkbox">
              {/* @ts-ignore */}
              <input type="checkbox" checked={this.bypassReqs} onchange={() => (this as any).bypassReqs = !(this as any).bypassReqs} />
              {app.translator.trans('flarum-tags.lib.tag_selection_modal.bypass_requirements')}
            </label>
          </div>
        ) : null}
      </div>
    );
  }

  /** 单个标签项（保持原生类名与交互，继承父类的切换/键盘导航逻辑） */
  private renderTagItem(tag: Tag, filter: string) {
    // @ts-ignore
    const active = this.indexTag === tag;
    // @ts-ignore
    const selected = this.selected && this.selected.includes(tag);

    return (
      <li
        key={tag.id()}
        data-index={tag.id()}
        className={classList('SelectTagListItem', {
          pinned: tag.position() !== null,
          child: !!tag.parent(),
          colored: !!tag.color(),
          selected,
          active,
        })}
        style={{ color: tag.color() || undefined }}
        // @ts-ignore
        onmouseover={() => (this.indexTag = tag)}
        // @ts-ignore
        onclick={() => this.toggleTag(tag)}
      >
        {tagIcon(tag)}
        <span className="SelectTagListItem-name">{highlight(tag.name() || '', filter)}</span>
        {tag.description() ? <span className="SelectTagListItem-description">{tag.description()}</span> : null}
      </li>
    );
  }
}
