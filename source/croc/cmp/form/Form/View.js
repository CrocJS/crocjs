croc.View.define('croc.cmp.form.Form.View', {
    members: {
        getLabelFontSize: function(size) {
            return {
                    1: '10',
                    2: '9',
                    3: '8',
                    4: '7',
                    5: '4'
                }[size] || '10';
        }
    }
});