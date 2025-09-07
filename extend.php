<?php

namespace LadyByron\TagCategories;

use Flarum\Api\Serializer\ForumSerializer;
use Flarum\Tags\Tag;
use Flarum\Extend;
use LadyByron\TagCategories\Api\Serializer\TagCategoryGroupSerializer;
use LadyByron\TagCategories\Model\TagCategoryGroup;
use LadyByron\TagCategories\ForumAttributes;

return [
    // 前端资源
    (new Extend\Frontend('forum'))
        ->js(__DIR__.'/js/dist/forum.js')
        ->css(__DIR__.'/resources/less/forum.less'),
    (new Extend\Frontend('admin'))
        ->js(__DIR__.'/js/dist/admin.js')
        ->css(__DIR__.'/resources/less/admin.less'),

    // 语言文件
    new Extend\Locales(__DIR__.'/resources/locale'),

    // 模型关系：给 Tag 注入多对多关系 categoryGroups
    (new Extend\Model(Tag::class))
        ->belongsToMany('categoryGroups', TagCategoryGroup::class, 'tag_category_group_tag', 'tag_id', 'group_id'),

    // API 路由（仅管理员可写）
    (new Extend\Routes('api'))
        ->get('/tag-categories', 'lady-byron.tag-categories.index', Api\Controller\ListTagCategoryGroupsController::class)
        ->post('/tag-categories', 'lady-byron.tag-categories.create', Api\Controller\CreateTagCategoryGroupController::class)
        ->patch('/tag-categories/{id}', 'lady-byron.tag-categories.update', Api\Controller\UpdateTagCategoryGroupController::class)
        ->delete('/tag-categories/{id}', 'lady-byron.tag-categories.delete', Api\Controller\DeleteTagCategoryGroupController::class)
        ->patch('/tag-categories/order', 'lady-byron.tag-categories.order', Api\Controller\OrderTagCategoryGroupsController::class)
        ->patch('/tag-categories/{id}/tags', 'lady-byron.tag-categories.sync-tags', Api\Controller\SyncGroupTagsController::class),

    // Forum 载荷：向前台注入只读的分组结构
    (new Extend\ApiSerializer(ForumSerializer::class))
        ->attribute('tagCategories', [ForumAttributes::class, 'tagCategories']),
];
