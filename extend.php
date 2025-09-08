<?php

namespace LadyByron\TagCategories;

use Flarum\Api\Serializer\ForumSerializer;
use Flarum\Extend;
use Flarum\Tags\Tag;
use LadyByron\TagCategories\Model\TagCategoryGroup;
use LadyByron\TagCategories\ForumAttributes;
// ✨ 关键：为 Api\Controller 起别名，下面用 ApiController\Xxx::class
use LadyByron\TagCategories\Api\Controller as ApiController;

return [
    // 前端资源
    (new Extend\Frontend('forum'))
        ->js(__DIR__ . '/js/dist/forum.js')
        ->css(__DIR__ . '/resources/less/forum.less'),
    (new Extend\Frontend('admin'))
        ->js(__DIR__ . '/js/dist/admin.js')
        ->css(__DIR__ . '/resources/less/admin.less'),

    // 语言文件
    new Extend\Locales(__DIR__ . '/resources/locale'),

    // 模型关系：给 Tag 注入多对多关系 categoryGroups
    (new Extend\Model(Tag::class))
        ->belongsToMany('categoryGroups', TagCategoryGroup::class, 'tag_category_group_tag', 'tag_id', 'group_id'),

    // API 路由（注意顺序与 id 约束，避免 shadowing）
    (new Extend\Routes('api'))
        ->get('/tag-categories', 'lady-byron.tag-categories.index', ApiController\ListTagCategoryGroupsController::class)
        ->post('/tag-categories', 'lady-byron.tag-categories.create', ApiController\CreateTagCategoryGroupController::class)

        // 静态路由在变量路由之前
        ->patch('/tag-categories/order', 'lady-byron.tag-categories.order', ApiController\OrderTagCategoryGroupsController::class)

        // 变量路由加数值约束
        ->patch('/tag-categories/{id:[0-9]+}', 'lady-byron.tag-categories.update', ApiController\UpdateTagCategoryGroupController::class)
        ->delete('/tag-categories/{id:[0-9]+}', 'lady-byron.tag-categories.delete', ApiController\DeleteTagCategoryGroupController::class)
        ->patch('/tag-categories/{id:[0-9]+}/tags', 'lady-byron.tag-categories.sync-tags', ApiController\SyncGroupTagsController::class),

    // Forum 载荷：向前台注入只读的分组结构
    (new Extend\ApiSerializer(ForumSerializer::class))
        ->attribute('tagCategories', [ForumAttributes::class, 'tagCategories']),
];

