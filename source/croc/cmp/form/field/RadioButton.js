//+use b-input-radio

/**
 * Radio button
 */
croc.Class.define('croc.cmp.form.field.RadioButton', {
    extend: croc.cmp.form.field.AbstractCheckButton,
    
    members: {
        /**
         * type of check button
         * @returns {string}
         */
        getButtonType: function() {
            return 'radio';
        }
    }
});