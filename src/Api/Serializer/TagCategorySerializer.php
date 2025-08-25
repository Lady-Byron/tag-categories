<?php

namespace LadyByron\TagCategories\Api\Serializer;

use Flarum\Api\Serializer\AbstractSerializer;

class TagCategorySerializer extends AbstractSerializer
{
    protected $type = 'tag-categories';

    protected function getDefaultAttributes($tagCategory): array
    {
        return [
            'name'       => $tagCategory->name,
            'slug'       => $tagCategory->slug,
            'description'=> $tagCategory->description,
            'sortOrder'  => (int) $tagCategory->sort_order,
            'createdAt'  => $this->formatDate($tagCategory->created_at),
        ];
    }

    public function getId($tagCategory): string
    {
        return (string) $tagCategory->id;
    }
}
