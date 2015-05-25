/**
 * Password field with "show password" button
 */
croc.Class.define('croc.cmp.form.field.PasswordField', {
    extend: croc.cmp.form.field.TextField,
    
    options: {
        /**
         * Предназначено ли поле для ввода пароля
         * @type {boolean}
         */
        password: true,
    
        /**
         * Показывать ли крестик для сброса значения поля или нет
         * @type {Boolean}
         */
        showReset: false
    }
});
