croc.View.define('croc.cmp.common.Resizer.View', {
    members: {
        getBorderStyle: function(zone, zones) {
            return 'left:' + this.getZoneSize(zone) + 'px;';
        },
        
        getZoneStyle: function(zone, zones) {
            var style = {};
            if (zone.stretch) {
                //todo поправить
                style['margin-left'] = (this.getZoneSize(zones[0]) + 1) + 'px';
            }
            else {
                style['width'] = this.getZoneSize(zone) + 'px';
                style['float'] = 'left';
            }
            _.assign(style, zone.style);
            return _.map(style, function(value, key) { return key + ':' + value + ';'; }).join('');
        },
        
        getZoneSize: function(zone) {
            if (zone.hidden) {
                return zone.hiddenSize;
            }
            var size = zone.size || zone.minSize;
            if (zone.minSize && size < zone.minSize) {
                size = zone.minSize;
            }
            if (zone.maxSize && size > zone.maxSize) {
                size = zone.maxSize;
            }
            return size;
        },
        
        onCreate: function() {
            var onResize = this.debounce(function() {
                this._widget.innerResize();
            }, this);
            this._model.on('change', 'zones.*.size', onResize);
            this._model.on('change', 'zones.*.hidden', onResize);
        },
        
        onMouseMove: function(e) {
            var zone = this._model.get('resizeZone');
            if (zone) {
                var zoneEl = this._model.get('_zones.' + zone.index);
                this._model.set('resizeZone.size', e.pageX - zoneEl.offset().left);
            }
        }
    }
});
