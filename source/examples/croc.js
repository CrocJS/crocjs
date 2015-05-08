module.exports = {
    general: {
        root: '../..',
        site: './public',
        compiled: './public'
    },
    type: ['js', 'wtpl'],
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