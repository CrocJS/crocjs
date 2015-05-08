/**
 * Поле ввода пароля с кнопкой "показать пароль"
 */
croc.Class.define('croc.ui.form.field.PasswordField', {
    extend: croc.ui.form.field.TextField,
    
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
    },
    
    members: {
        /**
         * Инициализация виджета после его отрисовки в DOM
         * @return {$.Deferred|undefined}
         * @protected
         */
        _initWidget: function() {
            croc.ui.form.field.PasswordField.superclass._initWidget.apply(this, arguments);
            
            this.__showButton.listenProperty('active', function(show) {
                this.setMasked(!show);
                croc.utils.domSetModifier(this.__showButton.getElement().find('.g-icon'), 'mod',
                    show ? 'unlocked' : 'locked');
                this.__showButton.getElement().attr('title', show ? 'Скрыть пароль' : 'Показать пароль');
            }, this);
            
            if (croc.util.Browser.isIE('<10')) {
                this.__showButton.onChangeProperty('active', function() {
                    this._getDisposer().defer(function() {
                        this.focus();
                        this.moveCursorToEnd();
                    }, this);
                }, this);
                
                this.__showButton.getElement().on({
                    mousedown: function() {
                        this._getDisposer().defer(function() {
                            this.focus();
                            this.moveCursorToEnd();
                        }, this);
                    }.bind(this)
                });
            }
        },
        
        /**
         * Выполняется когда свойства виджета уже инициализированы
         * @param {Object} options
         * @protected
         */
        _onPropertiesInitialized: function(options) {
            this.__showButton = options.cellsAfterInput = new croc.ui.form.Button({
                extraCls: 'place_input clip_rect round_right',
                wrapperTemplate: croc.ui.form.field.AbstractTextField.CELL_WRAPPER,
                size: options.size,
                scheme: null,
                radio: true,
                text: '<span class="g-icon set_lock size_' +
                (options.size === '1' || options.size === '2' ? 'small' : 'big') +
                ' mod_locked"><span class="g-icon-h"><span class="g-icon-item"></span></span></span>'
            });
            
            croc.ui.form.field.PasswordField.superclass._onPropertiesInitialized.apply(this, arguments);
        }
    }
});
