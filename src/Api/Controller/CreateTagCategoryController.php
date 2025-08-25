<?php

namespace LadyByron\TagCategories\Api\Controller;

use Flarum\Api\Controller\AbstractCreateController;
use Flarum\Http\RequestUtil;
use Illuminate\Support\Str;
use LadyByron\TagCategories\Api\Serializer\TagCategorySerializer;
use LadyByron\TagCategories\Database\Model\TagCategory;
use Psr\Http\Message\ServerRequestInterface;
use Tobscure\JsonApi\Document;

class CreateTagCategoryController extends AbstractCreateController
{
    public $serializer = TagCategorySerializer::class;

    protected function data(ServerRequestInterface $request, Document $document)
    {
        $actor = RequestUtil::getActor($request);
        $actor->assertAdmin();

        $attributes = $request->getParsedBody()['data']['attributes'] ?? [];

        $category = new TagCategory();
        $category->name        = $attributes['name'] ?? '';
        $category->slug        = $attributes['slug'] ?? Str::slug($category->name);
        $category->description = $attributes['description'] ?? null;
        $category->sort_order  = (int) ($attributes['sortOrder'] ?? 0);
        $category->save();

        return $category;
    }
}
