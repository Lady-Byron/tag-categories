<?php

namespace LadyByron\TagCategories\Model;

use Flarum\Database\AbstractModel;
use Flarum\Tags\Tag;

class TagCategoryGroup extends AbstractModel
{
    protected $table = 'tag_category_groups';

    protected $fillable = [
        'name', 'slug', 'description', 'order',
    ];

    protected $casts = [
        'order' => 'int',
    ];

    public function tags()
    {
        return $this->belongsToMany(Tag::class, 'tag_category_group_tag', 'group_id', 'tag_id');
    }

    public static function slugify(string $name): string
    {
        // 简易的 slug 生成；如需更精细，可接入 fof/transliterator
        $slug = preg_replace('~[^A-Za-z0-9]+~', '-', strtolower(trim($name)));
        $slug = trim($slug, '-');
        return $slug ?: uniqid('group_', false);
    }
}
