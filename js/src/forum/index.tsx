import app from 'flarum/forum/app';
import { extend, override } from 'flarum/common/extend';
import DiscussionControls from 'flarum/forum/utils/DiscussionControls';
import Button from 'flarum/common/components/Button';

// 原生弹窗
import TagDiscussionModal from 'flarum/tags/forum/components/TagDiscussionModal';
import TagSelectionModal from 'flarum/tags/forum/components/TagSelectionModal';

// 我们的分组版
import GroupedTagDiscussionModal from './components/GroupedTagDiscussionModal';

const EXT_ID = 'lady-byron/tag-categories';

app.initializers.add(EXT_ID, () => {
  // 1) 替换已发布讨论的“编辑标签”弹窗
  const originalShow = app.modal.show.bind(app.modal);
  (app.modal as any).show = function (component: any, attrs: any) {
    if (component === TagDiscussionModal) {
      component = GroupedTagDiscussionModal;
    }
    return originalShow(component, attrs);
  };

  extend(DiscussionControls, 'moderationControls', function (items, discussion) {
    if (discussion.canTag && discussion.canTag()) {
      items.add(
        'tags',
        <Button icon="fas fa-tag" onclick={() => app.modal.show(GroupedTagDiscussionModal, { discussion })}>
          {app.translator.trans('flarum-tags.forum.discussion_controls.edit_tags_button')}
        </Button>,
        100
      );
    }
  });

  // 2) 拦截“新建贴选择标签”弹窗（composer）
  override(TagSelectionModal.prototype, 'oninit', function (original, vnode) {
    const groups = app.forum.attribute('tagCategories') || [];
    if (groups.length) {
      const attrs: any = this.attrs;   // 继承原有属性（如回调）
      app.modal.close();
      app.modal.show(GroupedTagDiscussionModal, attrs);
      return;
    }
    original(vnode); // 无分组 -> 回退原生
  });
});
