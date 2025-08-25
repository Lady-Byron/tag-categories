import app from 'flarum/admin/app';
import ExtensionPage from 'flarum/admin/components/ExtensionPage';
import Button from 'flarum/common/components/Button';

export default class TagCategoriesSettingsPage extends ExtensionPage {
  oninit(vnode) {
    super.oninit(vnode);
    this.loading = true;
    this.categories = [];
    this.newCategory = { name: '', slug: '', description: '', sortOrder: 0 };

    app.request({ method: 'GET', url: app.forum.attribute('apiUrl') + '/tag-categories' })
      .then((payload) => {
        this.categories = app.store.pushPayload(payload);
      })
      .finally(() => { this.loading = false; m.redraw(); });
  }

  view() {
    return m('div.ExtensionPage-body', [
      m('h2', app.translator.trans('lady-byron-tag-categories.admin.settings.title')),
      this.loading ? m('p', 'Loading...') :
        m('div', [
          m('table', [
            m('thead', m('tr', [
              m('th', 'Name'), m('th', 'Slug'), m('th', 'Desc'), m('th', 'Sort')
            ])),
            m('tbody', this.categories.map(c =>
              m('tr', [
                m('td', c.name()), m('td', c.slug()),
                m('td', c.description() || ''), m('td', c.sortOrder())
              ])
            ))
          ]),
          m('form', {
            onsubmit: (e) => {
              e.preventDefault();
              this.loading = true;
              const attrs = this.newCategory;
              app.request({
                method: 'POST',
                url: app.forum.attribute('apiUrl') + '/tag-categories',
                body: { data: { attributes: attrs } }
              }).then((payload) => {
                app.store.pushPayload(payload);
                this.newCategory = { name: '', slug: '', description: '', sortOrder: 0 };
                return app.request({ method: 'GET', url: app.forum.attribute('apiUrl') + '/tag-categories' });
              }).then((payload) => {
                this.categories = app.store.pushPayload(payload);
              }).finally(() => { this.loading = false; m.redraw(); });
            }
          }, [
            m('.Form-group', [
              m('input.FormControl', { placeholder: 'Name', value: this.newCategory.name, oninput: e => this.newCategory.name = e.target.value })
            ]),
            m('.Form-group', [
              m('input.FormControl', { placeholder: 'Slug', value: this.newCategory.slug, oninput: e => this.newCategory.slug = e.target.value })
            ]),
            m('.Form-group', [
              m('input.FormControl', { placeholder: 'Description', value: this.newCategory.description, oninput: e => this.newCategory.description = e.target.value })
            ]),
            m('.Form-group', [
              m('input.FormControl', { type: 'number', placeholder: 'Sort Order', value: this.newCategory.sortOrder, oninput: e => this.newCategory.sortOrder = +e.target.value })
            ]),
            m(Button, { className: 'Button Button--primary', type: 'submit', loading: this.loading }, 'Add')
          ])
        ])
    ]);
  }
}
