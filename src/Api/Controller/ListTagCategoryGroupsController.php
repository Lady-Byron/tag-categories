<?php

namespace LadyByron\TagCategories\Api\Controller;

use Flarum\Api\Controller\AbstractListController;
use LadyByron\TagCategories\Api\Serializer\TagCategoryGroupSerializer;
use LadyByron\TagCategories\Repository\TagCategoryGroupRepository;
use Psr\Http\Message\ServerRequestInterface as Request;
use Tobscure\JsonApi\Document;

class ListTagCategoryGroupsController extends AbstractListController
{
    public $serializer = TagCategoryGroupSerializer::class;

    public $include = ['tags'];

    protected $groups;

    public function __construct(TagCategoryGroupRepository $groups)
    {
        $this->groups = $groups;
    }

    protected function data(Request $request, Document $document)
    {
        // include=tags 时联表返回
        $include = $this->extractInclude($request);
        $query = $this->groups->allOrdered();
        if (in_array('tags', $include, true)) {
            $query->load('tags');
        }

        return $query;
    }
}
