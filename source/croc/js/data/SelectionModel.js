croc.ns('croc.data');

/**
 * Модель выделенных в списке элементов
 */
croc.Class.define('croc.data.SelectionModel', {
    extend: croc.data.ObservableArray,
    
    options: {
        /**
         * @type {croc.data.IObservableList}
         */
        list: {
            required: true
        }
    },
    
    construct: function(options) {
        croc.data.SelectionModel.superclass.__construct__.apply(this, arguments);
        
        /**
         * @type {croc.data.IObservableList}
         * @private
         */
        this.__list = options.list;
        
        this.__list.on('change', function(index, remove, insert) {
            remove.forEach(function(item) {
                if (this.indexOf(item) !== -1 && insert.indexOf(item) === -1) {
                    this.remove(item);
                }
            }, this);
        }, this);
    },
    
    members: {
        /**
         * Возвращает первый выделенный элемент
         * @returns {Object}
         */
        getFirstItem: function() {
            return this.getItem(0);
        },
        
        /**
         * Возвращает индекс первого выделенного элемента
         * @returns {number}
         */
        getFirstItemIndex: function() {
            return this.getLength() > 0 ? this.__list.indexOf(this.getFirstItem()) : -1;
        },
        
        /**
         * Назначить единственный выделенный элемент
         * @param item
         */
        setSingleItem: function(item) {
            if (!item) {
                this.removeAll();
            }
            else {
                this.replaceAll([item]);
            }
        },
        
        /**
         * Назначить единственным выделенным элементом элемент с переданным индексом (можно передавать -1)
         * @param {number} index
         */
        setSingleItemIndex: function(index) {
            if (index === -1) {
                this.removeAll();
            }
            else {
                this.replaceAll([this.__list.getItem(index)]);
            }
        }
    }
});
