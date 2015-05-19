/**
 * Абстракция над полем ввода (text/textarea)
 */
croc.Class.define('croc.cmp.form.field.AbstractTextField', {
    type: 'abstract',
    extend: croc.cmp.form.field.AbstractHtmlControl,
    
    implement: [
        croc.cmp.form.field.ISizable,
        croc.cmp.form.field.IUpdatableField,
        croc.cmp.form.field.ITextField
    ],
    
    include: croc.cmp.form.field.MStandardSizable,
    
    properties: {
        /**
         * Мгновенное значение текстового поля
         * @type {string}
         */
        instantValue: {
            type: 'string',
            model: true
        },
    
        /**
         * плэйсхолдер для поля
         * @type {string}
         */
        placeholder: {
            type: 'string',
            model: true
        },
    
        /**
         * Размер поля
         * @type {string}
         */
        size: {
            type: 'string',
            __setter: null,
            value: '1',
            model: true
        }
    }
});
