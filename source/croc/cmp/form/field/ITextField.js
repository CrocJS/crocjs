/**
 * Интерфейс-маркер для текстовых полей
 */
croc.Interface.define('croc.cmp.form.field.ITextField', {
    extend: croc.cmp.form.field.IHtmlControl,
    
    members: {
        /**
         * Пробелы на концах значения являются важными и их нельзя обрезать
         * @returns {boolean}
         */
        keepWhiteSpace: function() {}
    }
});
