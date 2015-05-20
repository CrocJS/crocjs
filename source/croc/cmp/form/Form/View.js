croc.View.define('croc.cmp.form.Form.View', {
    members: {
        extractFieldId: function(html) {
            var match = html.match(new RegExp(croc.cmp.form.Form.FIELD_ID_PREFIX + '\\d+'));
            return match ? match[0] : '';
        },
        
        getLabelFontSize: function(size) {
            return {
                    1: '10',
                    2: '9',
                    3: '8',
                    4: '7',
                    5: '4'
                }[size] || '10';
        },
        
        /**
         * After widget creating
         */
        onCreate: function() {
            croc.cmp.form.Form.View.superclass.onCreate.apply(this, arguments);
            this._widget.listenProperty('disabled', function(value) {
                if (value) {
                    this.__disabledLinks = this.getElement().find('.g-pseudo:not(.state_disabled)')
                        .addClass('state_disabled');
                }
                else if (this.__disabledLinks) {
                    this.__disabledLinks.removeClass('state_disabled');
                }
            }, this);
        }
    }
});