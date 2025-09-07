<?php

namespace LadyByron\TagCategories\Api\Controller;

use Flarum\Api\Controller\AbstractDeleteController;
use Flarum\User\Exception\PermissionDeniedException;
use Flarum\User\User;
use LadyByron\TagCategories\Repository\TagCategoryGroupRepository;
use Psr\Http\Message\ServerRequestInterface as Request;

class DeleteTagCategoryGroupController extends AbstractDeleteController
{
    protected $groups;

    public function __construct(TagCategoryGroupRepository $groups)
    {
        $this->groups = $groups;
    }

    protected function delete(Request $request)
    {
        /** @var User $actor */
        $actor = $request->getAttribute('actor');
        if (!$actor->isAdmin()) {
            throw new PermissionDeniedException();
        }

        $id = (int) $request->getQueryParams()['id'];
        $group = $this->groups->findOrFail($id);

        // 级联删除 pivot
        $group->tags()->detach();
        $group->delete();
    }
}
