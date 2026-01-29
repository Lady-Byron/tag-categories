<?php

namespace LadyByron\TagCategories\Repository;

use Illuminate\Database\ConnectionInterface;
use Illuminate\Support\Collection;
use LadyByron\TagCategories\Model\TagCategoryGroup;

class TagCategoryGroupRepository
{
    protected ConnectionInterface $db;

    public function __construct(ConnectionInterface $db)
    {
        $this->db = $db;
    }

    public function allOrdered(): Collection
    {
        // 兼容 MySQL 和 PostgreSQL
        $driver = $this->db->getDriverName();
        $nullsLastExpr = $driver === 'pgsql'
            ? '("order" IS NULL)'
            : '(`order` IS NULL)';

        return TagCategoryGroup::query()
            ->orderByRaw($nullsLastExpr)
            ->orderBy('order')
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
