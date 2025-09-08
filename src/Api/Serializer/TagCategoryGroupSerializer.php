<?php

namespace LadyByron\TagCategories\Api\Serializer;

use Flarum\Api\Serializer\AbstractSerializer;
use Flarum\Tags\Api\Serializer\TagSerializer;
use LadyByron\TagCategories\Model\TagCategoryGroup;

class TagCategoryGroupSerializer extends AbstractSerializer
{
    /**
     * JSON:API type
     * 与前端 app.store.models['tag-category-groups'] 对应
     */
    protected $type = 'tag-category-groups';

    /**
     * @param TagCategoryGroup $group
     */
    protected function getDefaultAttributes($group): array
    {
        return [
            'name'        => $group->name,
            'slug'        => $group->slug,
            'description' => $group->description,
            'order'       => $group->order,
        ];
    }

    /**
     * 显式声明关系映射，支持 include=tags
     */
    protected function getRelationships($group): array
    {
        return [
            'tags' => $this->hasMany($group, TagSerializer::class),
        ];
    }
}
