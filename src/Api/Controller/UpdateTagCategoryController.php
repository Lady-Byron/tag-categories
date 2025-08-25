<?php

namespace LadyByron\TagCategories\Api\Controller;

use Flarum\Api\Controller\AbstractUpdateController;
use Flarum\Http\RequestUtil;
use Illuminate\Support\Arr;
use LadyByron\TagCategories\Api\Serializer\TagCategorySerializer;
use LadyByron\TagCategories\Database\Model\TagCategory;
use Psr\Http\Message\ServerRequestInterface;
use Tobscure\JsonApi\Document;

class UpdateTagCategoryController extends AbstractUpdateController
{
    public $serializer = TagCategorySerializer::class;

    protected function data(ServerRequestInterface $request, Document $document)
    {
        $actor = RequestUtil::getActor($request);
        $actor->assertAdmin();

        $id = (int) $request->getAttribute('id');
        $category = TagCategory::findOrFail($id);

        $attributes = Arr::get($request->getParsedBody(), 'data.attributes', []);

        if (array_key_exists('name', $attributes))        $category->name = $attributes['name'];
        if (array_key_exists('slug', $attributes))        $category->slug = $attributes['slug'];
        if (array_key_exists('description', $attributes)) $category->description = $attributes['description'];
        if (array_key_exists('sortOrder', $attributes))   $category->sort_order = (int) $attributes['sortOrder'];

        $category->save();

        return $category;
    }
}
