<?php

namespace LadyByron\TagCategories\Validator;

use Flarum\Foundation\AbstractValidator;

class TagCategoryGroupValidator extends AbstractValidator
{
    protected ?int $groupId = null;

    protected $rules = [
        'name' => ['required', 'string', 'max:100'],
        'slug' => ['nullable', 'string', 'max:100'],
        'description' => ['nullable', 'string', 'max:1000'],
        'order' => ['nullable', 'integer', 'min:0'],
    ];

    /**
     * 设置当前编辑的分组 ID（用于排除自身的唯一性检查）
     */
    public function setGroupId(?int $id): self
    {
        $this->groupId = $id;
        return $this;
    }

    /**
     * @inheritDoc
     */
    protected function getRules(): array
    {
        $rules = $this->rules;

        // 添加 slug 唯一性验证，编辑时排除当前记录
        $uniqueRule = 'unique:tag_category_groups,slug';
        if ($this->groupId !== null) {
            $uniqueRule .= ',' . $this->groupId;
        }

        $rules['slug'][] = $uniqueRule;

        return $rules;
    }
}
