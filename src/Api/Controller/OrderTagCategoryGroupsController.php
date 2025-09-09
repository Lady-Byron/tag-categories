<?php

namespace LadyByron\TagCategories\Api\Controller;

use Flarum\Api\Controller\AbstractListController;
use Flarum\Http\RequestUtil;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use LadyByron\TagCategories\Api\Serializer\TagCategoryGroupSerializer;
use LadyByron\TagCategories\Model\TagCategoryGroup;
use LadyByron\TagCategories\Repository\TagCategoryGroupRepository;
use Psr\Http\Message\ServerRequestInterface as Request;
use Tobscure\JsonApi\Document;

class OrderTagCategoryGroupsController extends AbstractListController
{
    public $serializer = TagCategoryGroupSerializer::class;

    protected TagCategoryGroupRepository $groups;

    public function __construct(TagCategoryGroupRepository $groups)
    {
        $this->groups = $groups;
    }

    protected function data(Request $request, Document $document)
    {
        // 仅管理员可排序（403 而非 500）
        RequestUtil::getActor($request)->assertAdmin();

        // 解析请求体中的 ids（尽量兼容）
        $ids = $this->extractIds($request);

        // 事务内批量更新；从 0 开始更直观（如需从 1 开始，改成 $index+1）
        DB::transaction(function () use ($ids) {
            foreach (array_values($ids) as $index => $id) {
                TagCategoryGroup::query()
                    ->where('id', $id)
                    ->update(['order' => $index]);
            }
        });

        // 返回最新顺序的完整列表（尽量带上关系，避免前端再拉）
        $list = $this->groups->allOrdered();

        // 兼容仓库返回类型（Collection 或 Builder）
        if (method_exists($list, 'load')) {
            // 如果你的序列化器/控制器需要 include，可在这里预加载关系
            $list->load('tags');
            return $list;
        }

        // 如果是 Builder，就按统一顺序取出
        return $list
            ->orderByRaw('CASE WHEN tag_category_groups.order IS NULL THEN 1 ELSE 0 END')
            ->orderBy('order')
            ->orderBy('id')
            ->get();
    }

    /**
     * 从请求中抽取 ids，兼容多种形状：
     * - { data: { attributes: { ids: [...] } } }
     * - { data: { ids: [...] } }
     * - { ids: [...] }
     * - 直接是数组: [...]
     */
    private function extractIds(Request $request): array
    {
        $body = $request->getParsedBody();

        // 如果中间件没解析（content-type 缺失等），回退解析原始 JSON
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
                // 过滤掉非正整数
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

