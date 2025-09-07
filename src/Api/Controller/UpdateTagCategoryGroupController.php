<?php

namespace LadyByron\TagCategories\Api\Controller;

use Flarum\Api\Controller\AbstractShowController;
use Flarum\User\Exception\PermissionDeniedException;
use Flarum\User\User;
use Illuminate\Support\Arr;
use LadyByron\TagCategories\Api\Serializer\TagCategoryGroupSerializer;
use LadyByron\TagCategories\Repository\TagCategoryGroupRepository;
use LadyByron\TagCategories\Validator\TagCategoryGroupValidator;
use Psr\Http\Message\ServerRequestInterface as Request;

class UpdateTagCategoryGroupController extends AbstractShowController
{
    public $serializer = TagCategoryGroupSerializer::class;

    protected $groups;
    protected $validator;

    public function __construct(TagCategoryGroupRepository $groups, TagCategoryGroupValidator $validator)
    {
        $this->groups = $groups;
        $this->validator = $validator;
    }

    protected function data(Request $request, $document)
    {
        /** @var User $actor */
        $actor = $request->getAttribute('actor');
        if (!$actor->isAdmin()) {
            throw new PermissionDeniedException();
        }

        $id = (int) Arr::get($request->getQueryParams(), 'id');
        $group = $this->groups->findOrFail($id);

        $attributes = Arr::get($request->getParsedBody(), 'data.attributes', []);
        $this->validator->assertValid($attributes + ['name' => $attributes['name'] ?? $group->name]);

        if (array_key_exists('name', $attributes)) {
            $group->name = $attributes['name'];
        }
        if (array_key_exists('slug', $attributes)) {
            $group->slug = $attributes['slug'] ?: TagCategoryGroup::slugify($group->name);
        }
        if (array_key_exists('description', $attributes)) {
            $group->description = $attributes['description'];
        }
        if (array_key_exists('order', $attributes)) {
            $group->order = $attributes['order'];
        }

        $group->save();

        return $group;
    }
}
