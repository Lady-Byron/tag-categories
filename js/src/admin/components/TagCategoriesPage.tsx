import app from 'flarum/admin/app';
import ExtensionPage from 'flarum/admin/components/ExtensionPage';
import Button from 'flarum/common/components/Button';
import LoadingIndicator from 'flarum/common/components/LoadingIndicator';
import icon from 'flarum/common/helpers/icon';

import EditGroupModal from './EditGroupModal';
import AssignTagsModal from './AssignTagsModal';
import TagCategoryGroup from '../../common/models/TagCategoryGroup';

export default class TagCategoriesPage extends ExtensionPage {
  private loading = true;
  private groups: TagCategoryGroup[] = [];
  private dirtyOrder = false;

  oninit(vnode: any) {
    super.oninit(vnode); // 必须：保留 ExtensionPage 的初始化逻辑（含开关等）
    this.load();
  }

  // 只渲染内容区；原生开关/标题/描述由 ExtensionPage 提供
  content() {
    if (this.loading) return <LoadingIndicator />;

    return (
      <div class="lbtc-TagCategoriesPage">
        <div class="container">
          <div class="Form-group">
            <h2>{app.translator.trans('lady-byron-tag-categories.admin.page.heading')}</h2>
            <div class="helpText">{app.translator.trans('lady-byron-tag-categories.admin.page.reorder_help')}</div>
          </div>

          <div class="Form-group">
            <Button className="Button Button--primary" onclick={() => this.openCreate()}>
              {icon('fas fa-plus')} {app.translator.trans('lady-byron-tag-categories.admin.page.create')}
            </Button>{' '}
            <Button disabled={!this.dirtyOrder} className="Button" onclick={() => this.saveOrder()}>
              {icon('fas fa-save')} {app.translator.trans('lady-byron-tag-categories.admin.page.save')}
            </Button>
          </div>

          <div class="Form-group">
            <ul class="TagCategoriesList">
              {this.groups.map((g, idx) => (
                <li class="TagCategoriesListItem" data-id={g.id()} key={g.id()}>
                  <div class="TagCategoriesListItem-main">
                    <div class="TagCategoriesListItem-title">
                      <strong>{g.name()}</strong>
                      {g.slug() ? <span class="TagCategoriesListItem-slug">/{g.slug()}</span> : null}
                    </div>
                    {g.description() ? <div class="TagCategoriesListItem-desc">{g.description()}</div> : null}
                  </div>

                  <div class="TagCategoriesListItem-actions">
                    <Button className="Button" icon="fas fa-arrow-up" disabled={idx === 0} onclick={() => this.move(idx, -1)} />
                    <Button className="Button" icon="fas fa-arrow-down" disabled={idx === this.groups.length - 1} onclick={() => this.move(idx, +1)} />
                    <Button className="Button" onclick={() => this.openAssign(g)} icon="fas fa-list-check">
                      {app.translator.trans('lady-byron-tag-categories.admin.page.assign_tags')}
                    </Button>
                    <Button className="Button" onclick={() => this.openEdit(g)} icon="fas fa-pen">
                      {app.translator.trans('lady-byron-tag-categories.admin.page.edit')}
                    </Button>
                    <Button className="Button Button--danger" onclick={() => this.confirmRemove(g)} icon="fas fa-trash">
                      {app.translator.trans('lady-byron-tag-categories.admin.page.delete')}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // --- actions ---

  private async load() {
    this.loading = true;
    m.redraw();

    try {
      const res = await app.request({
        method: 'GET',
        url: app.forum.attribute('apiUrl') + '/tag-categories',
      });

      // 反序列化成 store 模型并排序
      this.groups =
        (app.store.pushPayload(res) as any).toArray?.() ??
        app.store.all<TagCategoryGroup>('tag-category-groups');

      this.groups.sort((a, b) => {
        const ao = a.order() ?? Number.MAX_SAFE_INTEGER;
        const bo = b.order() ?? Number.MAX_SAFE_INTEGER;
        if (ao !== bo) return ao - bo;
        return (a.id() as number) - (b.id() as number);
      });

      this.dirtyOrder = false;
    } catch (error) {
      console.error('Failed to load tag categories:', error);
      app.alerts.show({ type: 'error' }, app.translator.trans('core.lib.error.generic_message'));
    } finally {
      this.loading = false;
      m.redraw();
    }
  }

  private move(idx: number, delta: number) {
    const ni = idx + delta;
    if (ni < 0 || ni >= this.groups.length) return;
    [this.groups[idx], this.groups[ni]] = [this.groups[ni], this.groups[idx]];
    this.dirtyOrder = true;
  }

  private async saveOrder() {
    const ids = this.groups.map((g) => g.id());
    this.loading = true;
    m.redraw();

    try {
      const res = await app.request({
        method: 'PATCH',
        url: app.forum.attribute('apiUrl') + '/tag-categories/order',
        body: { data: { attributes: { ids } } },
      });
      app.store.pushPayload(res);
      await this.load();
    } catch (error) {
      console.error('Failed to save order:', error);
      app.alerts.show({ type: 'error' }, app.translator.trans('core.lib.error.generic_message'));
    } finally {
      this.loading = false;
      m.redraw();
    }
  }

  private openCreate() {
    app.modal.show(EditGroupModal, { onsave: () => this.load() });
  }

  private openEdit(group: TagCategoryGroup) {
    app.modal.show(EditGroupModal, { group, onsave: () => this.load() });
  }

  private openAssign(group: TagCategoryGroup) {
    app.modal.show(AssignTagsModal, { group, onsave: () => this.load() });
  }

  private confirmRemove(group: TagCategoryGroup) {
    // 使用 Flarum 的确认对话框风格
    if (!window.confirm(String(app.translator.trans('lady-byron-tag-categories.admin.page.delete_confirm')))) {
      return;
    }
    this.remove(group);
  }

  private async remove(group: TagCategoryGroup) {
    this.loading = true;
    m.redraw();

    try {
      await app.request({
        method: 'DELETE',
        url: app.forum.attribute('apiUrl') + `/tag-categories/${group.id()}`,
      });
      this.groups = this.groups.filter((g) => g !== group);
    } catch (error) {
      console.error('Failed to delete category:', error);
      app.alerts.show({ type: 'error' }, app.translator.trans('core.lib.error.generic_message'));
    } finally {
      this.loading = false;
      m.redraw();
    }
  }
}
