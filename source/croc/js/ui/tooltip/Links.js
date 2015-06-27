/**
 * Тултип содержащий список ссылок
 */
croc.Class.define('croc.ui.tooltip.Links', {
    extend: croc.ui.tooltip.Tooltip,
    
    events: {
        /**
         * @param {Object} item
         */
        click: null
    },
    
    options: {
        /**
         * Скрывать выбранные значения из списка
         * @type {boolean}
         */
        hideSelected: false,
        
        /**
         * Ссылка является элементом списка (не оборачивается в контейнер)
         * @type {boolean}
         */
        inlineLink: false,
        
        /**
         * Дополнительные классы для каждого элемента
         * @type {string}
         */
        itemExtraCls: null,
        
        /**
         * {value: 'http://...', text: '...', $$icon: ..., $$click: ..., $$cls: ..., $$external: ...}
         * @type {Array|croc.data.IObservableList}
         */
        links: {
            type: ['array', 'croc.data.IObservableList']
        },
        
        /**
         * Вид списка (модификатор view_...)
         * @type {string}
         */
        listView: 'inline',
        
        /**
         * Тип ссылок в списке
         * @type {boolean}
         */
        linksType: {
            check: ['pseudo', 'real', 'block'],
            value: 'pseudo'
        },
        
        /**
         * @type {string}
         */
        listItemTemplate: '<div class="b-tooltip-item{cls}">{content}</div>',
        
        /**
         * @type {string}
         */
        listViewTemplate: '<div class="b-tooltip-list view_{view}{cls}">{items}</div>',
        
        /**
         * Класс для выделенных элементов
         * @type {string}
         */
        selectedItemClass: null,
        
        /**
         * Выбранные ссылки
         * @type {Array}
         */
        selection: {
            type: 'array'
        }
    },
    
    members: {
        /**
         * @returns {croc.data.IObservableList}
         */
        getLinks: function() {
            return this.__listView.getModel();
        },
        
        /**
         * @returns {croc.ui.list.View}
         */
        getListView: function() {
            return this.__listView;
        },
        
        /**
         * @returns {croc.data.SelectionModel}
         */
        getSelection: function() {
            return this.__listView.getSelection();
        },
        
        /**
         * @param value
         * @returns {Object}
         */
        findLinkByValue: function(value) {
            return _.find(this.__listView.getModel().getArray(), function(item) {
                return item.value === value;
            });
        },
        
        /**
         * Инициализация виджета после его отрисовки в DOM
         * @return {$.Deferred|undefined}
         * @protected
         */
        _initWidget: function() {
            croc.ui.tooltip.Links.superclass._initWidget.apply(this, arguments);
            
            this.__listView.getSelection().listenChanges(function(index, remove, insert) {
                remove.concat(insert).forEach(function(item) {
                    if (this.__listView.getModel().indexOf(item) !== -1) {
                        this.__listView.rerenderItem(item);
                    }
                }, this);
                
                if (this.__hideSelected) {
                    remove.forEach(function(item) {
                        this.__listView.getListItemElement(item).show();
                    }, this);
                    insert.forEach(function(item) {
                        this.__listView.getListItemElement(item).hide();
                    }, this);
                }
                
                if (this.getOpen()) {
                    this.reposition();
                }
            }, this);
            
            this.__listView.getModel().on('change', function() {
                if (this.getOpen()) {
                    this.reposition();
                }
            }, this);
            
            var onClick = function(item) {
                this.close();
                this.fireEvent('click', item);
                if (item.$$click) {
                    item.$$click(item);
                }
            }.bind(this);
            
            if (this.__inlineLink) {
                this.__listView.on('listItemClick', function(item) {
                    onClick(item);
                });
            }
            else {
                this.__listView.getElement().on('click', this.__listView.getListItemsSelector() +
                    (this.__linksType === 'pseudo' ? ' .b-pseudolink' : this.__linksType === 'real' ? ' a' : ''),
                    function(e) {
                        onClick(this.__listView.getListItemModel($(e.target)));
                    }.bind(this)
                );
            }
        },
        
        /**
         * Выполняется когда свойства виджета уже инициализированы
         * @param {Object} options
         * @protected
         */
        _onPropertiesInitialized: function(options) {
            this.__linksType = options.linksType;
            this.__hideSelected = options.hideSelected;
            this.__listItemTemplate = options.listItemTemplate;
            this.__inlineLink = options.inlineLink;
            this.__itemExtraCls = options.itemExtraCls;
            
            croc.ui.tooltip.Links.superclass._onPropertiesInitialized.apply(this, arguments);
            
            options.items.items = [
                new croc.ui.list.View({
                    onPreConstruct: function(listView) {
                        this.__listView = listView;
                    }.bind(this),
                    model: options.links,
                    htmlTemplate: options.listViewTemplate.render({view: options.listView}),
                    listParams: {
                        itemRenderer: function(item) {
                            return this._renderLink(item, this.__listView.getSelection().indexOf(item) !== -1);
                        }.bind(this),
                        selectedItemClass: options.selectedItemClass || null
                    },
                    listeners: {
                        changeRendered: function() {
                            if (options.selection) {
                                this.__listView.getSelection().replaceAll(options.selection);
                            }
                        }.bind(this)
                    }
                })
            ];
        },
        
        /**
         * @param item
         * @param active
         * @returns {string}
         * @protected
         */
        _renderLink: function(item, active) {
            var link;
            
            if (item.$$icon && !item.$$icon.html) {
                var icon = _.assign({}, item.$$icon);
                icon.cls = (icon.cls || '') + (this.__inlineLink ? '{cls}' : '');
                icon.attrs = icon.attrs || '';
                icon.text = item.text;
                
                if (this.__linksType === 'pseudo') {
                    icon.cls += ' g-link b-pseudolink';
                    icon.text = '<span class="b-pseudolink-h">' + icon.text + '</span>';
                }
                else if (active || this.__linksType === 'block') {
                    icon.tag = 'a';
                    icon.attrs += ' href="' + (item.value || '#') + '"';
                    if (item.$$external) {
                        icon.attrs += ' target="_blank"';
                    }
                }
                
                link = croc.ui.Render.icon(icon);
            }
            else {
                link = (active || this.__linksType === 'block' ?
                    (this.__inlineLink ? '<span class="{cls}">{text}</span>' : '{text}') :
                    this.__linksType === 'pseudo' ?
                    '<span class="g-link b-pseudolink' + (this.__inlineLink ? '{cls}' : '') + '"><span class="b-pseudolink-h">{text}</span></span>' :
                    '<a href="{value}"' + (item.$$external ? ' target="_blank"' : '') + (this.__inlineLink ? ' class="{cls}"' : '') + '>{text}</a>')
                    
                    .render({
                        value: item.value,
                        text: item.$$icon ? item.$$icon.html + item.text : item.text
                    });
            }
            
            var cls = '{cls}';
            if (item.$$cls) {
                cls += ' ' + item.$$cls;
            }
            if (this.__itemExtraCls) {
                cls += ' ' + this.__itemExtraCls;
            }
            return this.__inlineLink ? link.render({cls: cls}) :
                (item.$$tpl || this.__listItemTemplate).render({
                    content: link,
                    cls: cls
                });
        }
    }
});