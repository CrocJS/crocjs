module.exports = {
    general: {
        root: '../..',
        site: './public',
        compiled: './public',
        sources: [
            {
                symbol: 'jquery-ui',
                file: [
                    '/source/examples/vendor/jquery-ui/jquery-ui.css',
                    '/source/examples/vendor/jquery-ui/jquery-ui.min.js'
                ],
                meta: {server: false},
                analyze: false
            }
        ]
    },
    bower: '/bower_components',
    apps: [
        {
            path: '/source/examples',
            include: [
                'examples.controllers.Routes'
            ]
        }
    ]
};