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
        // 只有管理员可操作
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

        // 3) 返回最新顺序的完整列表，并携带 tags 关系
        //    关键修复：不要在表达式里写表名，避免前缀导致的 "Unknown column"。
        $driver = $this->db->getDriverName();
        $nullsLastExpr = $driver === 'pgsql'
            ? '("order" IS NULL)'
            : '(`order` IS NULL)';

        return TagCategoryGroup::query()
            ->with('tags')
            ->orderByRaw($nullsLastExpr)   // NULL 的排在最后（0 再到 1）
            ->orderBy('order')
            ->orderBy('id')
            ->get();
    }

    /**
     * 兼容多种请求体形状：
     * - { data: { attributes: { ids: [...] } } }
     * - { data: { ids: [...] } }
     * - { ids: [...] }
     * - 直接数组: [...]
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
