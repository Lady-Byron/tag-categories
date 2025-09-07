import Model from 'flarum/common/Model';
import type Tag from 'flarum/tags/common/models/Tag';

export default class TagCategoryGroup extends Model {
  name = Model.attribute<string>('name');
  slug = Model.attribute<string | null>('slug');
  description = Model.attribute<string | null>('description');
  order = Model.attribute<number | null>('order');

  // 可按需在前端关联 tags，但本项目主要通过自有 API 管理分配
  tags = Model.hasMany<Tag>('tags');
}
