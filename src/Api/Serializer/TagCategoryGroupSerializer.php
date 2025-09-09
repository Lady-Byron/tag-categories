<?php

namespace LadyByron\TagCategories\Api\Serializer;

use Flarum\Api\Serializer\AbstractSerializer;
use Flarum\Tags\Api\Serializer\TagSerializer;
use LadyByron\TagCategories\Model\TagCategoryGroup;

class TagCategoryGroupSerializer extends AbstractSerializer
{
    // 必须与前端 store type 一致
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
     * 关系：?include=tags 时生效
     * 注意：这里不要写返回类型，以避免不同 JSON:API 版本的类型不匹配导致 500。
     */
    public function tags($group)
    {
        return $this->hasMany($group, TagSerializer::class);
    }
}

