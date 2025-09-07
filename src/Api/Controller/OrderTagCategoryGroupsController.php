<?php

namespace LadyByron\TagCategories\Api\Controller;

use Flarum\Api\Controller\AbstractSerializeController;
use Flarum\User\Exception\PermissionDeniedException;
use Flarum\User\User;
use Illuminate\Support\Arr;
use LadyByron\TagCategories\Api\Serializer\TagCategoryGroupSerializer;
use LadyByron\TagCategories\Repository\TagCategoryGroupRepository;
use Psr\Http\Message\ServerRequestInterface as Request;
use Tobscure\JsonApi\Document;

class OrderTagCategoryGroupsController extends AbstractSerializeController
{
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
        if (!$actor->isAdmin()) {
            throw new PermissionDeniedException();
        }

        $ids = Arr::get($request->getParsedBody(), 'data.attributes.ids', []);
        $i = 1;
        foreach ($ids as $id) {
            $group = $this->groups->findOrFail((int) $id);
            $group->order = $i++;
            $group->save();
        }

        return $this->groups->allOrdered();
    }
}
