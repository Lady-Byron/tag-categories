import app from 'flarum/admin/app';
import { Extend } from 'flarum/common/extend';
import TagCategoriesPage from './components/TagCategoriesPage';
import TagCategoryGroup from '../common/models/TagCategoryGroup';

export const moduleName = 'lady-byron-tag-categories';

app.initializers.add(moduleName, () => {
  // 前端注册模型类型（与后端 serializer type 对齐：'tag-category-groups'）
  app.store.models['tag-category-groups'] = TagCategoryGroup;

  // 导航项
  app.extensionData
    .for(moduleName)
    .registerPage(TagCategoriesPage)
    .registerPermission(
      {
        icon: 'fas fa-layer-group',
        label: app.translator.trans('lady-byron-tag-categories.admin.nav.title'),
        permission: 'administrate',
      },
      'moderate',
      100
    );

  // 在扩展列表里显示描述（可选）
  app.extensionData.for(moduleName).registerSetting(function () {
    return m('div', { class: 'helpText' }, app.translator.trans('lady-byron-tag-categories.admin.nav.description'));
  });
});
