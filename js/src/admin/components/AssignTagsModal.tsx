import app from 'flarum/admin/app';
import Modal from 'flarum/common/components/Modal';
import Button from 'flarum/common/components/Button';
import type Tag from 'flarum/tags/common/models/Tag';
import type Mithril from 'mithril';
import TagCategoryGroup from '../../common/models/TagCategoryGroup';

interface Attrs extends Mithril.Attributes {
  group: TagCategoryGroup;
  onsave?: () => void;
}

export default class AssignTagsModal extends Modal<Attrs> {
  private ready = false;
  private allTags: Tag[] = [];
  // ✅ 用 string，而不是 number
  private selectedIds = new Set<string>();

  className() {
    return 'AssignTagsModal Modal--medium';
  }

  title() {
    return app.translator.trans('lady-byron-tag-categories.admin.page.assign_tags');
  }

  async oninit(vnode: Mithril.Vnode<Attrs, this>) {
    super.oninit(vnode);

    // 预加载 parent，保证 isChild()、层级判定 OK
    await app.store.find('tags', { include: 'parent', page: { limit: 999 } });
    this.allTags = app.store.all<Tag>('tags');

    // 拉取分组并附带 tags（配合后端 List 控制器的 $optionalInclude = ['tags']）
    const res = await app.request({
      method: 'GET',
      url: app.forum.attribute('apiUrl') + `/tag-categories?include=tags`,
    });
    app.store.pushPayload(res);

    const fresh = app.store.getById<TagCategoryGroup>(
      'tag-category-groups',
      this.attrs.group.id() as string
    );

    const current = fresh?.tags?.() as Tag[] | undefined;
    if (current) {
      current.forEach((t) => {
        const id = t.id();
        if (id) this.selectedIds.add(id);
      });
    }

    this.ready = true;
    m.redraw();
  }

  content() {
    if (!this.ready) {
      return (
        <div class="Modal-body">
          <p>Loading...</p>
        </div>
      );
    }

    const primaries = this.allTags.filter((t) => !t.isChild());
    const secondaries = this.allTags.filter((t) => t.isChild());

    const section = (label: string, items: Tag[]) => (
      <div class="Form-group">
        <h4>{label}</h4>
        <div class="CheckboxGrid">
          {items.map((t) => {
            const id = t.id()!; // string
            return (
              <label class="checkbox">
                <input
                  type="checkbox"
                  checked={this.selectedIds.has(id)}
                  onchange={(e: any) => this.toggle(id, e.target.checked)}
                />
                <span>{t.name()}</span>
              </label>
            );
          })}
        </div>
      </div>
    );

    return (
      <div class="Modal-body">
        <div class="Form">
          {section('Primary Tags', primaries)}
          {section('Secondary Tags', secondaries)}
          <div class="Form-group">
            <Button className="Button Button--primary" loading={this.loading} onclick={() => this.save()}>
              {app.translator.trans('lady-byron-tag-categories.admin.page.save')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  private toggle(id: string, checked: boolean) {
    if (checked) this.selectedIds.add(id);
    else this.selectedIds.delete(id);
  }

  private async save() {
    const tagIds = Array.from(this.selectedIds.values()); // string[]

    this.loading = true;
    m.redraw();

    try {
      await app.request({
        method: 'PATCH',
        url: app.forum.attribute('apiUrl') + `/tag-categories/${this.attrs.group.id()}/tags`,
        body: { data: { attributes: { tagIds } } },
      });

      this.hide();
      this.attrs.onsave?.();
    } finally {
      this.loading = false;
      m.redraw();
    }
  }
}
