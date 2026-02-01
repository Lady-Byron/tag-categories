import app from 'flarum/forum/app';
import { extend } from 'flarum/common/extend';
import DiscussionControls from 'flarum/forum/utils/DiscussionControls';
import Button from 'flarum/common/components/Button';

// 原生弹窗
import TagDiscussionModal from 'flarum/tags/forum/components/TagDiscussionModal';
import TagSelectionModal from 'flarum/tags/forum/components/TagSelectionModal';

// 我们的分组版弹窗（同时兼容"编辑已有讨论"和"新建时选择"两种场景）
import GroupedTagDiscussionModal from './components/GroupedTagDiscussionModal';

const EXT_ID = 'lady-byron/tag-categories';

app.initializers.add(EXT_ID, () => {
  const originalShow = app.modal.show.bind(app.modal);

  // 统一在 show 入口替换，不在 oninit 里做切换，避免 Nested m.redraw.sync
  (app.modal as any).show = function (component: any, attrs: any) {
    const groups = app.forum.attribute('tagCategories') || [];

    // 仅当站点存在分类组时才替换，保持无分组时沿用原生体验
    if (groups.length && (component === TagDiscussionModal || component === TagSelectionModal)) {
      component = GroupedTagDiscussionModal;
    }

    return originalShow(component, attrs);
  };

  // 兜底：讨论页"编辑标签"按钮也强制打开分组版
  extend(DiscussionControls, 'moderationControls', function (items, discussion) {
    const groups = app.forum.attribute('tagCategories') || [];

    // 仅当站点存在分类组时才替换按钮
    if (groups.length && discussion.canTag && discussion.canTag()) {
      // 先移除原生 flarum/tags 添加的按钮，再添加我们的版本
      if (items.has('tags')) {
        items.remove('tags');
      }

      items.add(
        'tags',
        <Button icon="fas fa-tag" onclick={() => app.modal.show(GroupedTagDiscussionModal, { discussion })}>
          {app.translator.trans('flarum-tags.forum.discussion_controls.edit_tags_button')}
        </Button>,
        100
      );
    }
  });
});
