<?php

namespace LadyByron\TagCategories\Listener;

use Flarum\Tags\Event\Saving;

class SaveTagCategories
{
    public function handle(Saving $event): void
    {
        if (isset($event->data['attributes']['categories']) && is_array($event->data['attributes']['categories'])) {
            $event->tag->categories()->sync($event->data['attributes']['categories']);
        }
    }
}
