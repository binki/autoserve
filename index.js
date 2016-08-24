/* -*- mode: js2; indent-tabs-mode: nil; -*- */
'use strict';

var fs = require('fs');
var process = require('process');

module.exports = function (app) {
    // Support FastCGI
    var fcgi = require('node-fastcgi');
    if (fcgi.isService()) {
        fcgi.createServer(app).listen();
        return;
    }

    // Autodetect CGI (in the future)
    if (process.env.SCRIPT_NAME) {
        console.log('Pure CGI mode is not supported yet.');
    }

    // The way people apparently normally launch node web servers:
    var http = require('http');

    var port = (typeof app.get === 'function' ? app.get('port') : undefined)
            || process.env.PORT
            || 3000;
    http.createServer(app).listen(port, function () {
        console.log('Listening on port ' + port);
    });
};

var staticBaseUrl;

module.exports.getBaseUrl = function (req) {
    // node-fastcgi: https://github.com/fbbdev/node-fastcgi/issues/11
    if (req.socket.params) {
        return req.socket.params.SCRIPT_NAME;
    }

    if (staticBaseUrl === undefined) {
        if (process.env.SCRIPT_NAME) {
            // pure CGI
            staticBaseUrl = process.env.SCRIPT_NAME;
        } else if (process.env.PASSENGER_BASE_URI) {
            // Passenger,
            // https://github.com/remko/base-uri/blob/ff560528afd75910a3bdba7a917383fa347ce2b6/index.js#L18
            // https://github.com/phusion/passenger/blob/69878eb58cc6273397755e62a99bb7394ab66b6d/test/stub/node/app.js#L23
            staticBaseUrl = process.env.PASSENGER_BASE_URI;
        } else {
            // node http module
            staticBaseUrl = '/';
        }
    }
    return staticBaseUrl;
};
