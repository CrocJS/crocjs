croc.Class.define('croc.ui.form.suggestion.AbstractGrouping', {
    extend: croc.ui.form.suggestion.Default,
    type: 'abstract',
    
    statics: {
        TEMPLATE_GROUP_HEADER: '' +
        '<div class="b-suggestion-header{cls}">' +
        '   <div class="b-suggestion-header-h">{text}</div>' +
        '</div>'
    },
    
    options: {
        /**
         * Разрешено ли группировать приходящие элементы
         * @type {boolean}
         */
        grouping: true
    },

    members: {
        /**
         * Возвращает html для заголовка группы
         * @param {Object} item
         * @returns {String}
         * @protected
         */
        _createGroupHeaderHtml: function(item) { throw 'abstract!'; },
        
        /**
         * Возвращает группу по элементу списка
         * @param {Object} item
         * @returns {String}
         * @protected
         */
        _getGroup: function(item) { throw 'abstract!'; },
        
        /**
         * Выполняется когда свойства виджета уже инициализированы
         * @param {Object} options
         * @protected
         */
        _onPropertiesInitialized: function(options) {
            if (options.grouping) {
                options.listParams.groupHeaderRenderer = this._createGroupHeaderHtml.bind(this);
                options.listParams.groupCriteria = this._getGroup.bind(this);
            }
            
            croc.ui.form.suggestion.AbstractGrouping.superclass._onPropertiesInitialized.apply(this, arguments);
        }
    }
});
