<?php

use Flarum\Database\Migration;

return Migration::createTable('tag_category_group_tag', function ($table) {
    $table->integer('group_id')->unsigned();
    $table->integer('tag_id')->unsigned();

    $table->primary(['group_id', 'tag_id']);

    $table->index('group_id');
    $table->index('tag_id');
});
