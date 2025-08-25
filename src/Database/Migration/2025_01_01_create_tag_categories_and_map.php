<?php

use Flarum\Database\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Schema\Builder;

return [
    'up' => function (Builder $schema) {
        if (!$schema->hasTable('tag_categories')) {
            $schema->create('tag_categories', function (Blueprint $table) {
                $table->increments('id');
                $table->string('name', 100);
                $table->string('slug', 100)->unique();
                $table->string('description')->nullable();
                $table->integer('sort_order')->default(0);
                $table->timestamps();
            });
        }

        if (!$schema->hasTable('tag_category_map')) {
            $schema->create('tag_category_map', function (Blueprint $table) {
                $table->unsignedInteger('tag_id');
                $table->unsignedInteger('category_id');

                $table->primary(['tag_id', 'category_id']);
                $table->foreign('tag_id')->references('id')->on('tags')->onDelete('cascade');
                $table->foreign('category_id')->references('id')->on('tag_categories')->onDelete('cascade');
            });
        }
    },
    'down' => function (Builder $schema) {
        $schema->dropIfExists('tag_category_map');
        $schema->dropIfExists('tag_categories');
    }
];
