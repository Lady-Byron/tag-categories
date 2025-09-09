import app from 'flarum/admin/app';
// import { Extend } from 'flarum/common/extend'; // 未使用，可删
import TagCategoriesPage from './components/TagCategoriesPage';
import TagCategoryGroup from '../common/models/TagCategoryGroup';

export const moduleName = 'lady-byron-tag-categories';

app.initializers.add(moduleName, () => {
  // 注册模型
  app.store.models['tag-category-groups'] = TagCategoryGroup;

  // 关键：通过 extensionData 注册页面（由 ExtensionPage 承载，才能保留原生开关）
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

  // 可选：显示一段说明文字
  app.extensionData.for(moduleName).registerSetting(() => {
    return m('div', { class: 'helpText' }, app.translator.trans('lady-byron-tag-categories.admin.nav.description'));
  });
});
