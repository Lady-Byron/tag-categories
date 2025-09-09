<?php

namespace LadyByron\TagCategories\Api\Controller;

use Flarum\Api\Controller\AbstractListController;
use Flarum\User\User;
use Flarum\Tags\Api\Serializer\TagSerializer;
use LadyByron\TagCategories\Api\Serializer\TagCategoryGroupSerializer;
use LadyByron\TagCategories\Model\TagCategoryGroup;
use Psr\Http\Message\ServerRequestInterface as Request;
use Tobscure\JsonApi\Document;

class ListTagCategoryGroupsController extends AbstractListController
{
    /** 返回资源的 serializer */
    public $serializer = TagCategoryGroupSerializer::class;

    /** 允许通过 include=... 带回的关系 */
    protected $optionalInclude = ['tags'];

    /**
     * 统一从模型层构建查询，确保：
     * - 始终返回 Collection（不是 Builder）
     * - include=tags 时用 with('tags') 预加载，避免后续 load() 失败
     */
    protected function data(Request $request, Document $document)
    {
        /** @var User $actor */
        $actor = $request->getAttribute('actor');

        // Forum 端允许只读：不做权限限制；若你要限制为仅管理员，可在此加 gate.
        $includes = $this->extractInclude($request);

        $query = TagCategoryGroup::query()->orderBy('order');

        if (in_array('tags', $includes, true)) {
            $query->with(['tags' => function ($q) {
                // 与 flarum/tags 的 TagSerializer 保持一致，常用预加载 parent
                $q->with('parent');
            }]);
        }

        // 关键：这里一定要 get()，保证返回 Collection
        return $query->get();
    }
}

