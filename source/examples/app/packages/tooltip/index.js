//+use croc.cmp.tooltip.Tooltip
//+use croc.cmp.tooltip.Pointer

module.exports = function(app) {
    app.on('load', function() {
        var target = $('#target');
        target.draggable().resizable();
        var form = app.page.form;
        var tooltip;
        
        var showTooltip = _.debounce(function(values) {
            if (tooltip) {
                tooltip.remove();
            }
            
            values = _.clone(values);
            
            var Cls = croc.Class.getClass('croc.cmp.tooltip.' + values.class);
            delete values.class;
            
            if (values.offset) {
                var offset = parseFloat(values.offset);
                if (isNaN(offset)) {
                    offset = JSON.parse(values.offset);
                }
                values.offset = offset;
            }
            
            if (values.target) {
                values.target = JSON.parse(values.target);
            }
            else {
                delete values.target;
            }
            
            values.autoSizeGap = values.autoSizeGap ? parseFloat(values.autoSizeGap) : 0;
            values.openDelay = values.openDelay ? parseFloat(values.openDelay) : 0;
            if (values.triggerSelector) {
                values.trigger = $('#delegates');
                values.triggerSelector = '.delegate';
                values.target = null;
            }
            else {
                delete values.triggerSelector;
            }
            
            if (values['target: mouseTrigger']) {
                if (!values.trigger) {
                    values.trigger = target;
                }
                values.target = 'mouseTrigger';
            }
            delete values['target: mouseTrigger'];
            
            tooltip = new Cls(_.assign({
                autoClose: false,
                target: target,
                listeners: {
                    beforeOpen: croc.utils.fnRetentiveBind(function(tooltip, target) {
                        if (values.triggerSelector) {
                            tooltip.setContent(target.html());
                        }
                    }, this)
                },
                style: 'max-width: 300px;'
            }, values));
            tooltip.open();
        }, 10);
        
        form.getItem('class').bind('value', form.getItem('content'), 'value', function(cls) {
            return cls === 'Tooltip' ?
                'тултип тултип тултип тултип тултип тултип тултип тултип тултип тултип тултип тултип тултип тултип тултип тултип тултип тултип тултип тултип тултип тултип тултип тултип тултип тултип тултип тултип тултип' :
                'тултип тултип тултип тултип тултип';
        });
        form.getStateManager().listenProperty('instantValues', showTooltip);
        
        app.Page.prototype.showTooltip = function() {
            showTooltip(form.getValues());
        };
        app.Page.prototype.destroyTooltip = function() {
            if (tooltip) {
                tooltip.remove();
            }
        };
    });
};