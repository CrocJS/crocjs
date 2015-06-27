module.exports = function(app) {
  app.model.set('_page.attrs', [['style', 'color: red']]);
  app.model.start('_page.attrsObj', '_page.attrs', function(attrs) {
    return _.clone(_.zipObject(attrs));
  });
  app.Page.prototype.addAttr = function() {
    app.model.push('_page.attrs', []);
  };
  app.Page.prototype.removeAttr = function(index) {
    app.model.remove('_page.attrs', index);
  };
  app.Page.prototype.mirror = function(obj) {
    return obj;
  };
};