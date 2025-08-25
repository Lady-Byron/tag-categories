import app from 'flarum/forum/app';
import Model from 'flarum/common/Model';
import Tag from 'flarum/tags/models/Tag';
import TagCategory from '../common/models/TagCategory';

app.initializers.add('lady-byron/tag-categories:forum', () => {
  app.store.models['tag-categories'] = TagCategory;
  Tag.prototype.categories = Model.hasMany('categories');

  console.log('[tag-categories] forum loaded');
});
