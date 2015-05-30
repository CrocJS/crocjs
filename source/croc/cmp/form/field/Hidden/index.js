/**
 * Hidden text field
 */
croc.Class.define('croc.cmp.form.field.Hidden', {
    extend: croc.cmp.Widget,
    include: croc.cmp.form.MStandardField,
    implement: croc.cmp.form.IField,
    
    properties: {
        /**
         * Is field disabled
         * @type {boolean}
         */
        disabled: {
            value: false,
            model: true
        },
        
        /**
         * @type {string}
         */
        value: {
            model: true
        }
    }
});
