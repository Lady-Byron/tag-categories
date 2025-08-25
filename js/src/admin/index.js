import app from 'flarum/admin/app';
import TagCategory from '../common/models/TagCategory';
import TagCategoriesSettingsPage from './components/TagCategoriesSettingsPage';

app.initializers.add('lady-byron/tag-categories:admin', () => {
  app.store.models['tag-categories'] = TagCategory;

  app.extensionData.for('lady-byron-tag-categories').registerPage(TagCategoriesSettingsPage);

  console.log('[tag-categories] admin loaded');
});
