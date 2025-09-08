import app from 'flarum/admin/app';
import Modal from 'flarum/common/components/Modal';
import Button from 'flarum/common/components/Button';
import Stream from 'flarum/common/utils/Stream';
import type Mithril from 'mithril';
import TagCategoryGroup from '../../common/models/TagCategoryGroup';

interface Attrs extends Mithril.Attributes {
  group?: TagCategoryGroup;
  onsave?: () => void;
}

export default class EditGroupModal extends Modal<Attrs> {
  // 先创建空的 Stream，不在这里读取 this.attrs（否则未初始化时报错）
  name = Stream<string>('');
  slug = Stream<string>('');
  description = Stream<string>('');
  // 用字符串流做双向绑定，保存时再 parseInt
  order = Stream<string>('');

  oninit(vnode: Mithril.Vnode<Attrs, this>) {
    super.oninit(vnode);

    const g = this.attrs.group;

    // 有 group（编辑）就用其值，没有（新建）就用默认空值
    this.name(g?.name?.() ?? '');
    this.slug(g?.slug?.() ?? '');
    this.description(g?.description?.() ?? '');
    this.order(g?.order?.() != null ? String(g.order()!) : '');
  }

  className() {
    return 'EditGroupModal Modal--small';
  }

  title() {
    return this.attrs.group
      ? app.translator.trans('lady-byron-tag-categories.admin.page.edit')
      : app.translator.trans('lady-byron-tag-categories.admin.page.create');
  }

  content() {
    return (
      <div class="Modal-body">
        <div class="Form">
          <div class="Form-group">
            <label>{app.translator.trans('lady-byron-tag-categories.admin.page.name')}</label>
            <input class="FormControl" bidi={this.name} />
          </div>

          <div class="Form-group">
            <label>{app.translator.trans('lady-byron-tag-categories.admin.page.slug')}</label>
            <input class="FormControl" bidi={this.slug} placeholder="auto-generated if empty" />
          </div>

          <div class="Form-group">
            <label>{app.translator.trans('lady-byron-tag-categories.admin.page.description')}</label>
            <textarea class="FormControl" rows={3} bidi={this.description} />
          </div>

          <div class="Form-group">
            <label>{app.translator.trans('lady-byron-tag-categories.admin.page.order')}</label>
            <input class="FormControl" type="number" bidi={this.order} />
          </div>

          <div class="Form-group">
            <Button className="Button Button--primary" onclick={() => this.save()}>
              {app.translator.trans('lady-byron-tag-categories.admin.page.save')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  async save() {
    const payload = {
      name: this.name(),
      slug: this.slug() || null,
      description: this.description() || null,
      order: this.order() === '' ? null : parseInt(this.order(), 10),
    };

    this.loading = true;
    m.redraw();

    try {
      if (this.attrs.group) {
        await app.request({
          method: 'PATCH',
          url: app.forum.attribute('apiUrl') + `/tag-categories/${this.attrs.group.id()}`,
          body: { data: { attributes: payload } },
        });
      } else {
        await app.request({
          method: 'POST',
          url: app.forum.attribute('apiUrl') + '/tag-categories',
          body: { data: { attributes: payload } },
        });
      }

      this.hide();
      this.attrs.onsave?.();
    } finally {
      this.loading = false;
      m.redraw();
    }
  }
}
