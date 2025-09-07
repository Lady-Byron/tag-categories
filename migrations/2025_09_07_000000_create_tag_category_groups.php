<?php

use Flarum\Database\Migration;

return Migration::createTable('tag_category_groups', function ($table) {
    $table->increments('id');
    $table->string('name', 100);
    $table->string('slug', 100)->nullable()->unique();
    $table->text('description')->nullable();
    $table->integer('order')->nullable()->index();
    $table->timestamps();
});
