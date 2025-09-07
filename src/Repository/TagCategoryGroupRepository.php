<?php

namespace LadyByron\TagCategories\Repository;

use Illuminate\Support\Collection;
use LadyByron\TagCategories\Model\TagCategoryGroup;

class TagCategoryGroupRepository
{
    public function allOrdered(): Collection
    {
        return TagCategoryGroup::query()
            ->orderByRaw('CASE WHEN `order` IS NULL THEN 1 ELSE 0 END, `order` ASC')
            ->orderBy('id')
            ->get();
    }

    public function findOrFail(int $id): TagCategoryGroup
    {
        return TagCategoryGroup::query()->findOrFail($id);
    }

    public function findBySlug(?string $slug): ?TagCategoryGroup
    {
        if (!$slug) return null;
        return TagCategoryGroup::query()->where('slug', $slug)->first();
    }
}
