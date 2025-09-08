import app from 'flarum/forum/app';
import { extend } from 'flarum/common/extend';
import DiscussionControls from 'flarum/forum/utils/DiscussionControls';
import Button from 'flarum/common/components/Button';

// 来自 flarum/tags 的原始弹窗
import TagDiscussionModal from 'flarum/tags/forum/components/TagDiscussionModal';
// 我们的分组版弹窗
import GroupedTagDiscussionModal from './components/GroupedTagDiscussionModal';

const EXT_ID = 'lady-byron/tag-categories';

app.initializers.add(EXT_ID, () => {
  // 1) 全局拦截：将所有对 TagDiscussionModal 的调用替换为分组版
  const originalShow = app.modal.show.bind(app.modal);
  (app.modal as any).show = function (component: any, attrs: any) {
    if (component === TagDiscussionModal) {
      component = GroupedTagDiscussionModal;
    }
    return originalShow(component, attrs);
  };

  // 2) 兜底：替换讨论页“编辑标签”按钮，确保点击打开分组版
  extend(DiscussionControls, 'moderationControls', function (items, discussion) {
    if (discussion.canTag && discussion.canTag()) {
      // 使用与 flarum/tags 相同的 key 'tags'，但更高优先级以覆盖
      items.add(
        'tags',
        <Button icon="fas fa-tag" onclick={() => app.modal.show(GroupedTagDiscussionModal, { discussion })}>
          {app.translator.trans('flarum-tags.forum.discussion_controls.edit_tags_button')}
        </Button>,
        100 // 高优先级覆盖
      );
    }
  });
});
