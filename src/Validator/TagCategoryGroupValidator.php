<?php

namespace LadyByron\TagCategories\Validator;

use Flarum\Foundation\AbstractValidator;

class TagCategoryGroupValidator extends AbstractValidator
{
    protected $rules = [
        'name' => ['required', 'string', 'max:100'],
        'slug' => ['nullable', 'string', 'max:100'],
        'description' => ['nullable', 'string', 'max:1000'],
        'order' => ['nullable', 'integer', 'min:0'],
    ];

    // 可按需自定义 messages / attributes
}
