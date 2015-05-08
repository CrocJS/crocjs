module.exports = {
    'general': {
        //путь до папки с js
        root: '../../../../',
        external: require('../../../../jsdep.external').vendorJS(),
        
        options: {
            htmlSymbolRegexp: [
                /(?:data-(?:xtype|plugin|popup)=|'xtype' ?=> ?)['"]([\w\d_\.]+)["']/g
            ],
            jsSymbolsMap: {
                '.ajax(': 'croc.ajax'
            }
        },
        
        //источники для поиска доступных файлов (символов)
        sources: [
            {
                path: '/source/croc/js',
                prefix: 'croc.',
                symbol: function(ref) {
                    return ref === 'core' ? 'croc' : ':default';
                },
                ignore: function(ref, symbol) {
                    if (symbol === 'croc.util.Disposer') {
                        return ['croc.ajax'];
                    }
                }
            }
        ]
    },
    
    'frameworkCore': {
        extend: 'general',
        
        include: [
            'croc.packageOld',
            'croc',
            'croc.utils'
        ]
    },
    
    'example': {
        extend: 'frameworkCore',
        
        include: [
            'croc.Compatibility',
            'croc.controllers.InitializeOld'
        ]
    }
};