module.exports = function(app) {
    app.on('load', function() {
        var target = $('#target');
        target.draggable().resizable();
        var form = app.page.form;
        var tooltip;
        
        var showTooltip = function(values) {
            if (tooltip) {
                tooltip.remove();
            }
            
            values = _.clone(values);
            
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
            
            values.autoSizeGap = values.autoSizeGap ? parseFloat(values.autoSizeGap) : null;
            values.openDelay = values.openDelay ? parseFloat(values.openDelay) : null;
            if (values.triggerSelector) {
                values.trigger = $('#samples');
                values.triggerSelector = '.tooltip-target';
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
            
            tooltip = new croc.cmp.tooltip.Tooltip(_.assign({
                autoClose: false,
                target: target,
                //listeners: {
                //    beforeOpen: croc.utils.fnRetentiveBind(function(tooltip, target) {
                //        if (target && target instanceof jQuery && target.hasClass('tooltip-target')) {
                //            tooltip.setContent(target.closest('.b-tooltip-body').html());
                //        }
                //    }, this)
                //},
                style: 'max-width: 300px;'
            }, values));
            tooltip.open();
        };
        
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