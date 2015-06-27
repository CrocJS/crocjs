module.exports = function(app) {
    app.on('load', function() {
        var suggestion = new croc.cmp.form.suggestion.Suggestion({
            field: app.page.field,
            model: [{text: 'one', value: 1}, {text: 'two', value: 2}, {text: 'three', value: 3}]
        }).render();
    });
};