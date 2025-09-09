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
    return super.view(vnode);
  }

  content() {
    // @ts-ignore 复用父类loading
    if (this.loading) return <LoadingIndicator />;

    const selectable: Tag[] =
      // @ts-ignore 复用父类的 tags
      (this.attrs.selectableTags ? this.attrs.selectableTags() : this.tags) || [];

    // @ts-ignore 复用父类的 filter Stream
    const filter: string = this.filter?.() || '';
    const canSelect = this.attrs.canSelect || (() => true);
    const visible = selectable.filter((t) => canSelect(t));

    const filtered = visible.filter((tag) => {
      if (!filter) return true;
      const text = `${tag.name()} ${tag.description() || ''}`.toLowerCase();
      return text.includes(filter.toLowerCase());
    });

    const categories: ForumTagCategory[] = (app.forum.attribute('tagCategories') as ForumTagCategory[]) || [];
    const id2tag = new Map<number, Tag>(filtered.map((t) => [t.id() as number, t]));

    const grouped = categories
      .map((g) => {
        const list = (g.tagIds || []).map((id) => id2tag.get(id)).filter(Boolean) as Tag[];
        return { group: g, tags: sortTags(list.slice()) };
      })
      .filter((entry) => entry.tags.length > 0);

    const groupedIdSet = new Set<number>();
    grouped.forEach((e) => e.tags.forEach((t) => groupedIdSet.add(t.id() as number)));
    const ungrouped = sortTags(filtered.filter((t) => !groupedIdSet.has(t.id() as number)));

    // 如果没有任何可显示的分节，回退父类原始渲染
    if (!grouped.length && !ungrouped.length) {
      return super.content();
    }

    // 头部（输入框+提交按钮）沿用父类
    // 下面只替换 footer 列表，把列表分节
    // ---- header ----
    const header = super.content()[0];
    // ---- footer 替换为分组列表 ----
    const renderSection = (title: string, tags: Tag[]) => (
      <div className="lbtc-GroupSection">
        <div className="lbtc-GroupSection-title">{title}</div>
        <ul className="TagSelectionModal-list SelectTagList">
          {tags.map((tag) => this.renderTagItem(tag, filter))}
        </ul>
      </div>
    );

    return [
      header,
      <div className="Modal-footer lbtc-GroupedTagSelection">
        {grouped.map(({ group, tags }) => renderSection(group.name, tags))}
        {ungrouped.length ? renderSection(app.translator.trans('lady-byron-tag-categories.forum.tag_selection.ungrouped') as unknown as string, ungrouped) : null}
        {this.attrs.limits?.allowBypassing ? (
          <div className="TagSelectionModal-controls">
            {/* @ts-ignore 复用父类字段 */}
            <button className="Button" onclick={() => (this.bypassReqs = !this.bypassReqs)}>
              {app.translator.trans('flarum-tags.lib.tag_selection_modal.bypass_requirements')}
            </button>
          </div>
        ) : null}
      </div>,
    ];
  }

  /** 与官方完全相同的单项结构，避免“多一个方块对勾”的问题 */
  private renderTagItem(tag: Tag, filter: string) {
    // @ts-ignore 复用父类状态
    const active = this.indexTag === tag;
    // @ts-ignore 复用父类 selected
    const selected = this.selected.includes(tag);

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
        <i className="SelectTagListItem-icon">
          {tagIcon(tag, { className: 'SelectTagListItem-tagIcon' })}
          {/* 关键：官方用于覆盖显示的对勾图标 */}
          <i className="icon TagIcon fas fa-check SelectTagListItem-checkIcon"></i>
        </i>
        <span className="SelectTagListItem-name">{highlight(tag.name(), filter)}</span>
        {tag.description() ? <span className="SelectTagListItem-description">{tag.description()}</span> : null}
      </li>
    );
  }
}
