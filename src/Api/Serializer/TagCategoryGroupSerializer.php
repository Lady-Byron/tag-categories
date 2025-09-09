<?php

namespace LadyByron\TagCategories\Api\Serializer;

use Flarum\Api\Serializer\AbstractSerializer;
use Flarum\Tags\Api\Serializer\TagSerializer;
use LadyByron\TagCategories\Model\TagCategoryGroup;
use Tobscure\JsonApi\Relationship;

class TagCategoryGroupSerializer extends AbstractSerializer
{
    /**
     * JSON:API type（需与前端 app.store.models['tag-category-groups'] 对应）
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
     * 关系：支持 ?include=tags
     */
    public function tags($group): Relationship
    {
        return $this->hasMany($group, TagSerializer::class);
    }
}
