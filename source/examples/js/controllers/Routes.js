croc.Class.define('examples.controllers.Routes', {
    extend: croc.Controller,
    members: {
        initRoutes: function() {
            var app = this.getApp();
            app.get(app.isPackage ? '/' + app.packageName + '/' : '/', function(page) {
                return page.render('index');
            });
        }
    }
});