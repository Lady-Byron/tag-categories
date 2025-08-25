<?php

namespace LadyByron\TagCategories\Api\Controller;

use Flarum\Api\Controller\AbstractListController;
use Flarum\Http\RequestUtil;
use LadyByron\TagCategories\Api\Serializer\TagCategorySerializer;
use LadyByron\TagCategories\Database\Model\TagCategory;
use Psr\Http\Message\ServerRequestInterface;
use Tobscure\JsonApi\Document;

class ListTagCategoriesController extends AbstractListController
{
    public $serializer = TagCategorySerializer::class;

    protected function data(ServerRequestInterface $request, Document $document)
    {
        $actor = RequestUtil::getActor($request);
        $actor->assertAdmin();

        return TagCategory::query()
            ->with('tags')
            ->orderBy('sort_order')
            ->get();
    }
}
