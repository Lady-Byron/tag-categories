<?php

namespace LadyByron\TagCategories\Api\Controller;

use Flarum\Api\Controller\AbstractShowController;
use Flarum\Tags\Tag;
use Flarum\User\Exception\PermissionDeniedException;
use Flarum\User\User;
use Illuminate\Support\Arr;
use LadyByron\TagCategories\Api\Serializer\TagCategoryGroupSerializer;
use LadyByron\TagCategories\Repository\TagCategoryGroupRepository;
use Psr\Http\Message\ServerRequestInterface as Request;

class SyncGroupTagsController extends AbstractShowController
{
    public $serializer = TagCategoryGroupSerializer::class;

    protected $groups;

    public function __construct(TagCategoryGroupRepository $groups)
    {
        $this->groups = $groups;
    }

    protected function data(Request $request, $document)
    {
        /** @var User $actor */
        $actor = $request->getAttribute('actor');
        if (!$actor->isAdmin()) {
            throw new PermissionDeniedException();
        }

        $routeParams = $request->getAttribute('routeParameters') ?? [];
        $id = (int) ($routeParams['id'] ?? 0);
        $group = $this->groups->findOrFail($id);

        // 期望 payload: { data: { attributes: { tagIds: [1,2,3] } } }
        $tagIds = Arr::get($request->getParsedBody(), 'data.attributes.tagIds', []);
        $tagIds = array_values(array_unique(array_map('intval', $tagIds)));

        // 只允许同步现有标签
        $validIds = Tag::query()->whereIn('id', $tagIds)->pluck('id')->all();
        $group->tags()->sync($validIds);

        return $group->load('tags');
    }
}
