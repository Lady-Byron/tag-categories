<?php

namespace LadyByron\TagCategories\Api\Controller;

use Flarum\Api\Controller\AbstractCreateController;
use Flarum\User\Exception\PermissionDeniedException;
use Flarum\User\User;
use Illuminate\Support\Arr;
use LadyByron\TagCategories\Api\Serializer\TagCategoryGroupSerializer;
use LadyByron\TagCategories\Model\TagCategoryGroup;
use LadyByron\TagCategories\Validator\TagCategoryGroupValidator;
use Psr\Http\Message\ServerRequestInterface as Request;

class CreateTagCategoryGroupController extends AbstractCreateController
{
    public $serializer = TagCategoryGroupSerializer::class;

    protected $validator;

    public function __construct(TagCategoryGroupValidator $validator)
    {
        $this->validator = $validator;
    }

    protected function data(Request $request, $document)
    {
        /** @var User $actor */
        $actor = $request->getAttribute('actor');

        if (!$actor->isAdmin()) {
            throw new PermissionDeniedException();
        }

        $attributes = Arr::get($request->getParsedBody(), 'data.attributes', []);
        $this->validator->assertValid($attributes);

        $group = new TagCategoryGroup();
        $group->name = $attributes['name'];
        $group->slug = $attributes['slug'] ?? TagCategoryGroup::slugify($group->name);
        $group->description = $attributes['description'] ?? null;
        $group->order = $attributes['order'] ?? null;
        $group->save();

        return $group;
    }
}
