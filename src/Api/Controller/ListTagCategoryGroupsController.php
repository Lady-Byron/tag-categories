<?php

namespace LadyByron\TagCategories\Api\Controller;

use Flarum\Api\Controller\AbstractListController;
use Flarum\User\User;
use LadyByron\TagCategories\Api\Serializer\TagCategoryGroupSerializer;
use LadyByron\TagCategories\Repository\TagCategoryGroupRepository;
use Psr\Http\Message\ServerRequestInterface as Request;
use Tobscure\JsonApi\Document;

class ListTagCategoryGroupsController extends AbstractListController
{
    /** 允许 ?include=tags */
    protected $optionalInclude = ['tags'];

    /** 使用的 serializer */
    public $serializer = TagCategoryGroupSerializer::class;

    protected $groups;

    public function __construct(TagCategoryGroupRepository $groups)
    {
        $this->groups = $groups;
    }

    protected function data(Request $request, Document $document)
    {
        /** @var User $actor */
        $actor = $request->getAttribute('actor');

        $include = $this->extractInclude($request); // 解析 ?include=

        // 取出分组（按你的仓库方法）
        $groups = $this->groups->allOrdered(); // 通常返回 Eloquent\Collection

        // 如果请求了 include=tags，则预加载，避免 N+1
        if (in_array('tags', $include, true)) {
            // Eloquent\Collection 也有 ->load()
            $groups->load('tags');
        }

        return $groups;
    }
}
