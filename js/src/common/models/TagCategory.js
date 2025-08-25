import Model from 'flarum/common/Model';

export default class TagCategory extends Model {
  name = Model.attribute('name');
  slug = Model.attribute('slug');
  description = Model.attribute('description');
  sortOrder = Model.attribute('sortOrder');
  createdAt = Model.attribute('createdAt');
}
