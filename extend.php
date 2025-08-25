<?php

use Flarum\Extend;
use Flarum\Tags\Tag;
use Flarum\Tags\Event\Saving as TagSaving;
use Flarum\Tags\Api\Serializer\TagSerializer as TagApiSerializer;

use LadyByron\TagCategories\Api\Controller;
use LadyByron\TagCategories\Api\Serializer\TagCategorySerializer;
use LadyByron\TagCategories\Database\Model\TagCategory;

return [
    (new Extend\Frontend('forum'))->js(__DIR__ . '/js/dist/forum.js'),
    (new Extend\Frontend('admin'))->js(__DIR__ . '/js/dist/admin.js'),

    (new Extend\Routes('api'))
        ->get('/tag-categories', 'tag-categories.index', Controller\ListTagCategoriesController::class)
        ->post('/tag-categories', 'tag-categories.store', Controller\CreateTagCategoryController::class)
        ->patch('/tag-categories/{id}', 'tag-categories.update', Controller\UpdateTagCategoryController::class)
        ->delete('/tag-categories/{id}', 'tag-categories.delete', Controller\DeleteTagCategoryController::class),

    // Tag 的 API 增加 hasMany 关系：categories
    (new Extend\ApiSerializer(TagApiSerializer::class))
        ->hasMany('categories', TagCategorySerializer::class),

    // 后端 Eloquent Tag 模型增加 belongsToMany 关系
    (new Extend\Model(Tag::class))
        ->belongsToMany('categories', TagCategory::class, 'tag_category_map', 'tag_id', 'category_id'),

    // 本地化
    (new Extend\Locales(__DIR__ . '/resources/locale')),

    // 迁移（复数）+ 路径
    (new Extend\Migrations())->path(__DIR__ . '/src/Database/Migration'),

    // 保存 Tag 时同步 categories（如果你的前端会从 /api/tags 提交 categories）
    (new Extend\Event())
        ->listen(TagSaving::class, \LadyByron\TagCategories\Listener\SaveTagCategories::class),
];
