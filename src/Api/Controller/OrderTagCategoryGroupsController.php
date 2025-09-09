<?php

namespace LadyByron\TagCategories\Api\Controller;

use Flarum\Api\Controller\AbstractListController;
use Flarum\Http\RequestUtil;
use Illuminate\Database\ConnectionInterface;
use Illuminate\Support\Arr;
use LadyByron\TagCategories\Api\Serializer\TagCategoryGroupSerializer;
use LadyByron\TagCategories\Model\TagCategoryGroup;
use LadyByron\TagCategories\Repository\TagCategoryGroupRepository;
use Psr\Http\Message\ServerRequestInterface as Request;
use Tobscure\JsonApi\Document;

class OrderTagCategoryGroupsController extends AbstractListController
{
    public $serializer = TagCategoryGroupSerializer::class;

    protected TagCategoryGroupRepository $groups;

    /** @var ConnectionInterface */
    protected $db;

    public function __construct(TagCategoryGroupRepository $groups, ConnectionInterface $db)
    {
        $this->groups = $groups;
        $this->db = $db;
    }

    protected function data(Request $request, Document $document)
    {
        // 只有管理员可操作，抛 403 而非 500
        RequestUtil::getActor($request)->assertAdmin();

        // 1) 解析 ids（兼容多种形状 + 容错）
        $ids = $this->extractIds($request);

        // 2) 事务内批量更新顺序（从 0 开始；如需 1 开始可改为 $index+1）
        $this->db->transaction(function () use ($ids) {
            foreach (array_values($ids) as $index => $id) {
                TagCategoryGroup::query()
                    ->where('id', $id)
                    ->update(['order' => $index]);
            }
        });

        // 3) 统一返回最新顺序的完整列表，并携带 tags 关系
        //    根据数据库驱动选择一个稳妥的 "NULLS LAST" 表达式
        $driver = $this->db->getDriverName();
        $nullsLastExpr = $driver === 'pgsql'
            ? '(tag_category_groups."order" IS NULL)'
            : '(tag_category_groups.`order` IS NULL)';

        return TagCategoryGroup::query()
            ->with('tags')
            ->orderByRaw($nullsLastExpr)   // NULL 的排在最后
            ->orderBy('order')
            ->orderBy('id')
            ->get();
    }

    /**
     * 兼容多种请求体形状：
     * - { data: { attributes: { ids: [...] } } }
     * - { data: { ids: [...] } }
     * - { ids: [...] }
     * - 直接是数组: [...]
     */
    private function extractIds(Request $request): array
    {
        $body = $request->getParsedBody();

        // 某些环境 content-type/中间件问题：回退原始 JSON
        if (!is_array($body)) {
            $raw = (string) $request->getBody();
            $decoded = json_decode($raw, true);
            $body = is_array($decoded) ? $decoded : [];
        }

        $candidates = [
            Arr::get($body, 'data.attributes.ids'),
            Arr::get($body, 'data.ids'),
            Arr::get($body, 'ids'),
            $body, // 直接数组
        ];

        foreach ($candidates as $value) {
            if (is_array($value)) {
                $ids = array_values(array_unique(array_map('intval', $value)));
                // 仅保留正整数
                $ids = array_values(array_filter($ids, fn ($v) => $v > 0));
                if (!empty($ids)) {
                    return $ids;
                }
            }
        }

        // 兜底：空数组（不会抛错）
        return [];
    }
}

