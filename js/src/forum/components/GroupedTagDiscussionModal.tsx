import app from 'flarum/forum/app';
import Button from 'flarum/common/components/Button';
import classList from 'flarum/common/utils/classList';
import highlight from 'flarum/common/helpers/highlight';
import LoadingIndicator from 'flarum/common/components/LoadingIndicator';
import extractText from 'flarum/common/utils/extractText';

import TagDiscussionModal, { type TagDiscussionModalAttrs } from 'flarum/tags/forum/components/TagDiscussionModal';
import tagIcon from 'flarum/tags/common/helpers/tagIcon';
import tagLabel from 'flarum/tags/common/helpers/tagLabel';
import ToggleButton from 'flarum/tags/forum/components/ToggleButton';
import type Tag from 'flarum/tags/common/models/Tag';

type Vnode = Mithril.Vnode<TagDiscussionModalAttrs, GroupedTagDiscussionModal>;

interface ForumTagCategory {
  id: number;
  name: string;
  slug: string | null;
  order: number | null;
  tagIds: number[];
}

/** 与原生一致的宽度计算：CJK 算 2 个字符宽 */
function lengthWithCJK(text: string) {
  let len = 0;
  for (const ch of text || '') {
    len += /[\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF]/.test(ch) ? 2 : 1;
  }
  return len;
}

export default class GroupedTagDiscussionModal extends TagDiscussionModal<TagDiscussionModalAttrs> {
  view(vnode: Vnode) {
    return super.view(vnode);
  }

  content() {
    // @ts-ignore inherited
    if (this.loading || !this.tags) return <LoadingIndicator />;

    // ===== 原生顶部（chips + 输入 + 提交）保留 =====
    // @ts-ignore inherited
    const primaryCount = this.primaryCount();
    // @ts-ignore inherited
    const secondaryCount = this.secondaryCount();
    // @ts-ignore inherited
    const filteredTags: Tag[] = this.getFilteredTags();

    const instruction = extractText(
      // @ts-ignore inherited
      this.getInstruction(primaryCount, secondaryCount)
    );
    // @ts-ignore inherited
    const inputWidth = Math.max(lengthWithCJK(instruction), lengthWithCJK(this.filter()));

    // ====== 我们的分组逻辑（只替换列表部分）======
    const categories: ForumTagCategory[] = (app.forum.attribute('tagCategories') as ForumTagCategory[]) || [];
    const id2tag = new Map<number, Tag>(filteredTags.map((t) => [Number(t.id()), t]));

    const grouped = categories
      .map((g) => ({
        group: g,
        tags: (g.tagIds || []).map((id) => id2tag.get(Number(id))).filter(Boolean) as Tag[],
      }))
      .filter((e) => e.tags.length);

    const groupedIdSet = new Set<number>();
    grouped.forEach((e) => e.tags.forEach((t) => groupedIdSet.add(Number(t.id()))));
    const ungrouped = filteredTags.filter((t) => !groupedIdSet.has(Number(t.id())));

    const listItems: Mithril.Children[] = [];
    // 若没有有效分组，完全回退到原生列表（外观/交互不变）
    if (!grouped.length) {
      listItems.push(...filteredTags.map((tag) => this.renderTagLi(tag)));
    } else {
      for (const { group, tags } of grouped) {
        listItems.push(<li className="TagSelectionModal-groupHeader">{group.name}</li>);
        listItems.push(...tags.map((tag) => this.renderTagLi(tag)));
      }
      if (ungrouped.length) {
        listItems.push(
          <li className="TagSelectionModal-groupHeader">
            {app.translator.trans('lady-byron-tag-categories.forum.tag_selection.ungrouped')}
          </li>
        );
        listItems.push(...ungrouped.map((tag) => this.renderTagLi(tag)));
      }
    }

    // ===== 原生的整体骨架（body + footer） =====
    return [
      <div className="Modal-body">
        <div className="TagSelectionModal-form">
          <div className="TagSelectionModal-form-input">
            <div
              // @ts-ignore inherited
              className={'TagsInput FormControl ' + (this.focused ? 'focus' : '')}
              onclick={() => this.$('.TagsInput input').focus()}
            >
              <span className="TagsInput-selected">
                {
                  // @ts-ignore inherited
                  this.selected.map((tag: Tag) => (
                    <span
                      className="TagsInput-tag"
                      onclick={() => {
                        // @ts-ignore inherited
                        this.removeTag(tag);
                        // @ts-ignore inherited
                        this.onready();
                      }}
                    >
                      {tagLabel(tag)}
                    </span>
                  ))
                }
              </span>
              <input
                className="FormControl"
                placeholder={instruction}
                // @ts-ignore inherited
                bidi={this.filter}
                style={{ width: inputWidth + 'ch' }}
                // @ts-ignore inherited
                onkeydown={this.navigator.navigate.bind(this.navigator)}
                // @ts-ignore inherited
                onfocus={() => (this.focused = true)}
                // @ts-ignore inherited
                onblur={() => (this.focused = false)}
              />
            </div>
          </div>
          <div className="TagSelectionModal-form-submit App-primaryControl">
            <Button
              type="submit"
              className="Button Button--primary"
              // @ts-ignore inherited
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
          // @ts-ignore inherited
          this.attrs.limits?.allowBypassing && (
            <div className="TagSelectionModal-controls">
              {
                // @ts-ignore inherited
                <ToggleButton className="Button" onclick={() => (this.bypassReqs = !this.bypassReqs)} isToggled={this.bypassReqs}>
                  {app.translator.trans('flarum-tags.lib.tag_selection_modal.bypass_requirements')}
                </ToggleButton>
              }
            </div>
          )
        }
      </div>,
    ];
  }

  /** 单个标签项 —— 完全沿用原生 DOM/类名/交互 */
  private renderTagLi(tag: Tag) {
    // @ts-ignore inherited
    const selected = this.selected.includes(tag);
    // @ts-ignore inherited
    const active = this.indexTag === tag;
    // @ts-ignore inherited
    const filterStr: string = this.filter().toLowerCase();

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
        // @ts-ignore inherited
        onmouseover={() => (this.indexTag = tag)}
        // @ts-ignore inherited
        onclick={this.toggleTag.bind(this, tag)}
      >
        <i className="SelectTagListItem-icon">
          {tagIcon(tag, { className: 'SelectTagListItem-tagIcon' })}
          {/* 只在选中时渲染勾号 */}
          {selected ? <i className="icon TagIcon fas fa-check SelectTagListItem-checkIcon" /> : null}
        </i>
        <span className="SelectTagListItem-name">{highlight(tag.name(), filterStr)}</span>
        {tag.description() ? <span className="SelectTagListItem-description">{tag.description()}</span> : ''}
      </li>
    );
  }
}
