'use strict';

var scriptName = process.env.SCRIPT_NAME;


module.exports = {
    name: 'cgi',
    detect: function () {
        return !!scriptName;
    },
    serve: function (app) {
        throw new Error('Pure CGI mode is still unsupported.');
    },
    getBaseUrl: function () {
        return scriptName;
    },
};
