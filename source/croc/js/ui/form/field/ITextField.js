/**
 * Интерфейс-маркер для текстовых полей
 */
croc.Interface.define('croc.ui.form.field.ITextField', {
    extend: croc.ui.form.field.IHtmlControl,
    
    members: {
        /**
         * Пробелы на концах значения являются важными и их нельзя обрезать
         * @returns {boolean}
         */
        keepWhiteSpace: function() {}
    }
});
