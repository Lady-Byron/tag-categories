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

const toKey = (id: string | number | undefined | null) => String(id ?? '');

export default class GroupedTagDiscussionModal extends TagDiscussionModal<TagDiscussionModalAttrs> {
  view(vnode: Vnode) {
    return super.view(vnode);
  }

  content() {
    // 正在加载 tags：沿用父类的 loading 标志
    // @ts-ignore
    if (this.loading) return <LoadingIndicator />;

    // 可选标签集合：沿用父类 props/约束
    // @ts-ignore
    const base: Tag[] = (this.attrs.selectableTags ? this.attrs.selectableTags() : this.tags) || [];

    // @ts-ignore 父类的搜索 Stream
    const filter: string = this.filter?.() || '';
    const canSelect = this.attrs.canSelect || (() => true);

    const visible = base.filter((t) => canSelect(t));
    const filtered = visible.filter((tag) => {
      if (!filter) return true;
      const text = `${tag.name()} ${tag.description() || ''}`.toLowerCase();
      return text.includes(filter.toLowerCase());
    });

    // —— 分组数据（来自 Forum 载荷）——
    const categories: ForumTagCategory[] = (app.forum.attribute('tagCategories') as ForumTagCategory[]) || [];

    // 关键修正：Map 的 key 统一用 string
    const id2tag = new Map<string, Tag>(filtered.map((t) => [toKey(t.id()), t]));

    const grouped = categories
      .map((g) => {
        const list = (g.tagIds || []).map((id) => id2tag.get(toKey(id))).filter(Boolean) as Tag[];
        return { group: g, tags: sortTags(list.slice()) };
      })
      .filter((entry) => entry.tags.length > 0);

    // 未分组：从过滤后集合里剔除已分组 ID
    const groupedIdSet = new Set<string>();
    grouped.forEach((e) => e.tags.forEach((t) => groupedIdSet.add(toKey(t.id()))));
    const ungrouped = sortTags(filtered.filter((t) => !groupedIdSet.has(toKey(t.id()))));

    // 如果没有任何分节，回退父类渲染
    if (!grouped.length && !ungrouped.length) {
      return super.content();
    }

    // 头部（输入框+提交按钮）直接复用父类的第一段
    const parentChunks = super.content();
    const header = Array.isArray(parentChunks) ? parentChunks[0] : parentChunks;

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

  /** 单项渲染：完全对齐 flarum/tags 的结构和类名 */
  private renderTagItem(tag: Tag, filter: string) {
    // @ts-ignore
    const active = this.indexTag === tag;
    // @ts-ignore
    const selected = Array.isArray(this.selected) && this.selected.includes(tag);

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
          <i className="icon TagIcon fas fa-check SelectTagListItem-checkIcon"></i>
        </i>
        <span className="SelectTagListItem-name">{highlight(tag.name(), filter)}</span>
        {tag.description() ? <span className="SelectTagListItem-description">{tag.description()}</span> : null}
      </li>
    );
  }
}
