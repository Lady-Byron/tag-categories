<?php

namespace LadyByron\TagCategories\Api\Controller;

use Flarum\Api\Controller\AbstractDeleteController;
use Flarum\Http\RequestUtil;
use LadyByron\TagCategories\Database\Model\TagCategory;
use Psr\Http\Message\ServerRequestInterface;

class DeleteTagCategoryController extends AbstractDeleteController
{
    protected function delete(ServerRequestInterface $request)
    {
        $actor = RequestUtil::getActor($request);
        $actor->assertAdmin();

        $id = (int) $request->getAttribute('id');
        $category = TagCategory::findOrFail($id);
        $category->delete();
    }
}
