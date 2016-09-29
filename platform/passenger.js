'use strict'

// This support for Passenger is theoretical and as of yet untested!
// Please report bugs!

var passengerBaseUri = process.env.PASSENGER_BASE_URI;

module.exports = {
    name: 'passenger',
    detect: function () {
        return !!passengerBaseUri;
    },
    serve: require('./http').serve,
    getBaseUrl: function () {
        // Passenger,
        // https://github.com/remko/base-uri/blob/ff560528afd75910a3bdba7a917383fa347ce2b6/index.js#L18
        // https://github.com/phusion/passenger/blob/69878eb58cc6273397755e62a99bb7394ab66b6d/test/stub/node/app.js#L23
        return passengerBaseUri;
    },
};
