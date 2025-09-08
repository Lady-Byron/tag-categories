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
  name = Stream(this.attrs.group?.name() || '');
  slug = Stream(this.attrs.group?.slug() || '');
  description = Stream(this.attrs.group?.description() || '');
  order = Stream<string>(this.attrs.group?.order()?.toString?.() || '');

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
            <textarea class="FormControl" rows="3" bidi={this.description} />
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

      if (this.attrs.onsave) this.attrs.onsave();
    } finally {
      this.loading = false;
      m.redraw();
    }
  }
}
