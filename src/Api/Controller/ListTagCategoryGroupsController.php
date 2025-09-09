<?php

namespace LadyByron\TagCategories\Api\Controller;

use Flarum\Api\Controller\AbstractListController;
use LadyByron\TagCategories\Api\Serializer\TagCategoryGroupSerializer;
use LadyByron\TagCategories\Repository\TagCategoryGroupRepository;
use Psr\Http\Message\ServerRequestInterface as Request;
use Tobscure\JsonApi\Document;

class ListTagCategoryGroupsController extends AbstractListController
{
    /** 序列化器 */
    public $serializer = TagCategoryGroupSerializer::class;

    /** 允许通过 ?include= 声明的关系 */
    public $optionalInclude = ['tags'];

    protected $groups;

    public function __construct(TagCategoryGroupRepository $groups)
    {
        $this->groups = $groups;
    }

    protected function data(Request $request, Document $document)
    {
        // 只返回按顺序的分组列表；具体是否包含 tags 由 $optionalInclude 和请求的 ?include=tags 决定
        return $this->groups->allOrdered();
    }
}
