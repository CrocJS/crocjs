var lastId = 0;

croc.Class.define('test.cmp.Test', {
    extend: croc.cmp.Widget,
    options: {
        some: 10
    },
    members: {
        getContextId: function(context) {
            if (context.alias !== '#context') {
                context = context.parent;
            }
            return context.$$myId || (context.$$myId = ++lastId);
        }
    }
});