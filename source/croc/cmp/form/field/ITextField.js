/**
 * api-ru Интерфейс-маркер для текстовых полей
 * api-en Interface-marker for text fields.
 */
croc.Interface.define('croc.cmp.form.field.ITextField', {
    extend: croc.cmp.form.field.IHtmlControl,
    
    members: {
        /**
         * api-ru Пробелы на концах значения являются важными и их нельзя обрезать
         * api-en Spaces, at the values ends are important and they can't be removed.
         * @returns {boolean}
         */
        keepWhiteSpace: function() {}
    }
});
