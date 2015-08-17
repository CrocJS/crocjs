/**
 * Password field with "show password" button
 */
croc.Class.define('croc.cmp.form.field.PasswordField', {
    extend: croc.cmp.form.field.TextField,
    
    options: {
        /**
         * api-ru Предназначено ли поле для ввода пароля
         * api-en Is field intended for enter a password?
         * @type {boolean}
         */
        password: true,
    
        /**
         * api-ru Показывать ли крестик для сброса значения поля или нет
         * api-en Does reset icon needs to be shown?
         * @type {Boolean}
         */
        showReset: false
    }
});
