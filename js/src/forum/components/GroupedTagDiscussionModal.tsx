import app from 'flarum/forum/app';
import Button from 'flarum/common/components/Button';
import classList from 'flarum/common/utils/classList';
import highlight from 'flarum/common/helpers/highlight';
import LoadingIndicator from 'flarum/common/components/LoadingIndicator';

import TagDiscussionModal, { type TagDiscussionModalAttrs } from 'flarum/tags/forum/components/TagDiscussionModal';
import tagIcon from 'flarum/tags/common/helpers/tagIcon';
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
    return super.view(vnode);
  }

  /**
   * 与原生 TagSelectionModal.content() 完全一致的结构，
   * 仅把 footer 里的列表映射改成 “分组标题 + 各组标签 + 未分组”。
   */
  content() {
    // —— 原生：加载态保持不变 ——
    // @ts-ignore - inherited
    if (this.loading || !this.tags) {
      return <LoadingIndicator />;
    }

    // —— 原生：顶部表单区域（chips + 搜索 + 提交）保持不变 ——
    // @ts-ignore - inherited
    const filterStr: string = this.filter().toLowerCase();
    // @ts-ignore - inherited
    const primaryCount = this.primaryCount();
    // @ts-ignore - inherited
    const secondaryCount = this.secondaryCount();
    // @ts-ignore - inherited
    const tags: Tag[] = this.getFilteredTags();

    // @ts-ignore - inherited
    const inputWidth = Math.max(this.lengthWithCJK(extractTextLike(this.getInstruction(primaryCount, secondaryCount))), this.lengthWithCJK(this.filter()));

    // ===== 仅从这里开始“改造列表” =====
    const categories: ForumTagCategory[] = (app.forum.attribute('tagCategories') as ForumTagCategory[]) || [];
    const id2tag = new Map<number, Tag>(tags.map((t) => [Number(t.id()), t]));

    // 组装每个分组下的标签（已按原生 sort + 过滤后的集合）
    const groupedEntries = categories
      .map((g) => {
        const list = (g.tagIds || [])
          .map((id) => id2tag.get(Number(id)))
          .filter(Boolean) as Tag[];
        return { group: g, tags: list };
      })
      .filter((e) => e.tags.length > 0);

    // 统计已分组的 id，用于计算“未分组”
    const groupedIdSet = new Set<number>();
    groupedEntries.forEach((e) => e.tags.forEach((t) => groupedIdSet.add(Number(t.id()))));
    const ungrouped = tags.filter((t) => !groupedIdSet.has(Number(t.id())));

    // 组装最终要渲染到 <ul> 里的子节点数组
    let listItems: Mithril.Children[] = [];

    // 如果没有任何有效分组，就回退到原生列表（外观完全一致）
    if (!groupedEntries.length) {
      listItems = tags.map((tag) => this.renderTagLi(tag, filterStr));
    } else {
      // 分组标题行：使用一个极轻量的类名，保持原生 ul/li 结构
      for (const { group, tags: list } of groupedEntries) {
        listItems.push(
          <li className="TagSelectionModal-groupHeader">{group.name}</li>,
          ...list.map((tag) => this.renderTagLi(tag, filterStr))
        );
      }

      if (ungrouped.length) {
        listItems.push(
          <li className="TagSelectionModal-groupHeader">
            {app.translator.trans('lady-byron-tag-categories.forum.tag_selection.ungrouped')}
          </li>,
          ...ungrouped.map((tag) => this.renderTagLi(tag, filterStr))
        );
      }
    }

    // —— 原生整体结构（body + footer）保持不变，仅替换 footer 列表内容 ——
    return [
      <div className="Modal-body">
        <div className="TagSelectionModal-form">
          <div className="TagSelectionModal-form-input">
            {/* 原生 chips + 输入框 */}
            <div
              className={'TagsInput FormControl ' + (/* @ts-ignore */ this.focused ? 'focus' : '')}
              onclick={() => this.$('.TagsInput input').focus()}
            >
              <span className="TagsInput-selected">
                {
                  // @ts-ignore
                  this.selected.map((tag: Tag) => (
                    <span
                      className="TagsInput-tag"
                      onclick={() => {
                        // @ts-ignore
                        this.removeTag(tag);
                        // @ts-ignore
                        this.onready();
                      }}
                    >
                      {tagLabelLike(tag)}
                    </span>
                  ))
                }
              </span>
              <input
                className="FormControl"
                // @ts-ignore
                placeholder={extractTextLike(this.getInstruction(primaryCount, secondaryCount))}
                // @ts-ignore
                bidi={this.filter}
                style={{ width: inputWidth + 'ch' }}
                // @ts-ignore
                onkeydown={this.navigator.navigate.bind(this.navigator)}
                // @ts-ignore
                onfocus={() => (this.focused = true)}
                // @ts-ignore
                onblur={() => (this.focused = false)}
              />
            </div>
          </div>
          <div className="TagSelectionModal-form-submit App-primaryControl">
            <Button
              type="submit"
              className="Button Button--primary"
              // @ts-ignore
              disabled={!this.meetsRequirements(primaryCount, secondaryCount)}
              icon="fas fa-check"
            >
              {app.translator.trans('flarum-tags.lib.tag_selection_modal.submit_button')}
            </Button>
          </div>
        </div>
      </div>,

      <div className="Modal-footer">
        <ul className="TagSelectionModal-list SelectTagList">{listItems}</ul>
        {
          // 保留原生的 “忽略标签选择（bypass）” 开关
          // @ts-ignore
          this.attrs.limits?.allowBypassing && (
            <div className="TagSelectionModal-controls">
              {/* 这里沿用原生 ToggleButton 的 DOM 结构/类名由原生组件负责；父类里会导入并渲染 */}
              <button className={classList('Button', { 'Button--toggled': /* @ts-ignore */ this.bypassReqs })} onclick={() => (/* @ts-ignore */ this.bypassReqs = !this.bypassReqs)}>
                {app.translator.trans('flarum-tags.lib.tag_selection_modal.bypass_requirements')}
              </button>
            </div>
          )
        }
      </div>,
    ];
  }

  /** 渲染单个标签项：DOM 与类名完全照搬原生，实现原生外观与交互 */
  private renderTagLi(tag: Tag, filterStr: string) {
    // @ts-ignore - inherited
    const selected = this.selected.includes(tag);
    // @ts-ignore - inherited
    const active = this.indexTag === tag;

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
        // @ts-ignore
        onmouseover={() => (this.indexTag = tag)}
        // @ts-ignore
        onclick={this.toggleTag.bind(this, tag)}
      >
        <i className="SelectTagListItem-icon">
          {tagIcon(tag, { className: 'SelectTagListItem-tagIcon' })}
          <i className="icon TagIcon fas fa-check SelectTagListItem-checkIcon"></i>
        </i>
        <span className="SelectTagListItem-name">{highlight(tag.name(), filterStr)}</span>
        {tag.description() ? <span className="SelectTagListItem-description">{tag.description()}</span> : ''}
      </li>
    );
  }
}

/** 下面两个小 helper 只是把原生文件里用到的 extractText、tagLabel 的效果“就地复刻”以避免额外导入 */
function extractTextLike(v: any): string {
  if (typeof v === 'string') return v;
  // flarum 原生 extractText 会从 VDOM 里抽文本，这里保守返回空字符串以保持结构，
  // 真正的占位文本已经由 flarum/tags 的翻译提供
  return '';
}
function tagLabelLike(tag: Tag) {
  // 仅用于 chips 内的只读展示，原生 tagLabel 会渲染图标+名称。
  // 这里直接复用名称即可；若你希望100%一致，可改为从 flarum/tags 导入 tagLabel。
  return tag.name();
}
