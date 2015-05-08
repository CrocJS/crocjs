/**
 * Позволяет родителю компонента задать контекст истории бразуера для него. Сам компонент должен использовать
 * методы миксина для реализации такой возможности. Если historyContext не будет передан, то контекст не будет назначаться.
 */
croc.Mixin.define('croc.services.MHistoryClient', {
    options: {
        historyContext: {
            type: 'string'
        }
    },
    
    preConstruct: function(options) {
        this.__objOptions = options;
        this.__historyService = croc.getService(croc.services.History);
    },
    
    members: {
        /**
         * Функция будет вызываться каждый раз, когда контекст будет устанавливаться в текущее значение (в том числе
         * она будет вызвана немедленно если контекст в текущем значении). Функция должна возвращать унбиндер или массив
         * унбиндеров (функции, которые удаляют обработчики событий)
         * @param {function():function|Array.<function>|undefined} func
         * @param [context]
         * @protected
         */
        _addHistoryTrigger: function(func, context) {
            this._getHistoryDisposer().addTrigger(func, context);
        },
        
        /**
         * Сервис истории бразуера
         * @returns {croc.services.History}
         * @protected
         */
        _getHistoryService: function() {
            return this.__historyService;
        },
        
        /**
         * Регистрирует параметр истории браузера через {@link croc.services.History#registerParam} и назначает ему
         * контекст через {@link croc.services.History#setParamContext}
         * @param {string} param
         * @param {Object} [options] see {@link croc.services.History#registerParam}
         * @param {boolean} [options.restore=false]
         * @protected
         */
        _registerHistoryParam: function(param, options) {
            if (!options) {
                options = {};
            }
            this.__historyService.registerParam(param, options);
            this._setParamContext(param, options.restore);
        },
        
        /**
         * Назначает параметру контекст через {@link croc.services.History#setParamContext}
         * @param {string} param
         * @param {boolean} restore
         * @protected
         */
        _setParamContext: function(param, restore) {
            if (this.__objOptions.historyContext) {
                this.__historyService.setParamContext(param, this.__objOptions.historyContext, restore);
            }
        },
        
        /**
         * Если контекст назначен, то возвращает disposer для текущего контекста, иначе disposer текущего объекта.
         * @returns {croc.util.Disposer}
         * @protected
         */
        _getHistoryDisposer: function() {
            if (!this.__historyDisposer) {
                this.__historyDisposer = this.__objOptions.historyContext ?
                    this.__historyService.getContextDisposer(this.__objOptions.historyContext, this._getDisposer()) :
                    this._getDisposer();
            }
            return this.__historyDisposer;
        }
    }
});