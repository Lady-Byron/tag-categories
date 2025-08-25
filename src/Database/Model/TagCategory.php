<?php

namespace LadyByron\TagCategories\Database\Model;

use Flarum\Database\AbstractModel;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Flarum\Tags\Tag;

class TagCategory extends AbstractModel
{
    protected $table = 'tag_categories';

    protected $dates = ['created_at', 'updated_at'];

    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class, 'tag_category_map', 'category_id', 'tag_id');
    }
}
