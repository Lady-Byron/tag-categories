<?php

namespace LadyByron\TagCategories\Api\Serializer;

use Flarum\Api\Serializer\AbstractSerializer;
use LadyByron\TagCategories\Model\TagCategoryGroup;
use Tobscure\JsonApi\Relationship;

class TagCategoryGroupSerializer extends AbstractSerializer
{
    protected $type = 'tag-category-groups';

    /**
     * @param TagCategoryGroup $group
     */
    protected function getDefaultAttributes($group)
    {
        return [
            'name' => $group->name,
            'slug' => $group->slug,
            'description' => $group->description,
            'order' => $group->order,
        ];
    }

    public function tags($group): Relationship
    {
        return $this->hasMany($group, \Flarum\Tags\Api\Serializer\TagSerializer::class);
    }
}
