<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Schema\Builder;

return [
    'up' => function (Builder $schema) {
        $schema->table('tag_category_group_tag', function (Blueprint $table) {
            $table->foreign('group_id')
                ->references('id')
                ->on('tag_category_groups')
                ->onDelete('cascade');

            $table->foreign('tag_id')
                ->references('id')
                ->on('tags')
                ->onDelete('cascade');
        });
    },

    'down' => function (Builder $schema) {
        $schema->table('tag_category_group_tag', function (Blueprint $table) {
            $table->dropForeign(['group_id']);
            $table->dropForeign(['tag_id']);
        });
    },
];
