<?php

namespace LadyByron\TagCategories;

use Flarum\Api\Serializer\ForumSerializer;
use LadyByron\TagCategories\Repository\TagCategoryGroupRepository;

class ForumAttributes
{
    public static function tagCategories(ForumSerializer $serializer): array
    {
        // 为简化起见，Forum 端发送完整分组与 tag id 列表；
        // 前端会与 app.store.all('tags') 求交集，确保只显示当前用户可见的标签。
        $repo = resolve(TagCategoryGroupRepository::class);
        $groups = $repo->allOrdered()->loadMissing('tags');

        $out = [];
        foreach ($groups as $g) {
            $out[] = [
                'id' => (int) $g->id,
                'name' => $g->name,
                'slug' => $g->slug,
                'order' => $g->order,
                'tagIds' => $g->tags->pluck('id')->map(fn ($v) => (int) $v)->values()->all(),
            ];
        }

        return $out;
    }
}
