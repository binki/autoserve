'use strict';

var requireFcgi = function () {
    return require('node-fastcgi');
};

module.exports = {
    name: 'node-fastcgi',
    detect: function () {
        return requireFcgi().isService();
    },
    serve: function (app) {
        requireFcgi().createServer(app).listen();
    },
    getBaseUrl: function (req) {
        // https://github.com/fbbdev/node-fastcgi/issues/11
        return req.socket.params.SCRIPT_NAME;
    },
};
