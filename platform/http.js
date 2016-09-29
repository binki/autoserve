'use strict';

module.exports = {
    name: 'http',
    detect: function () {
        return true;
    },
    serve: function (app) {
        // The way people apparently normally launch node web servers:
        var http = require('http');

        var port = (typeof app.get === 'function' ? app.get('port') : undefined)
                || process.env.PORT
                || 3000;
        http.createServer(app).listen(port, function () {
            console.log('Listening on port ' + port);
        });
    },
    // This platform is “always” available, so give other platforms
    // a chance first.
    weight: 100,
};