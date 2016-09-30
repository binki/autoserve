#!/usr/bin/env node
'use strict';

const autoserve = require('autoserve');

const app = function (req, res) {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8', });
    // It is recommended to use a framework like express to calculate
    // the host and protocol of your deployment. baseUrl only
    // solves the path portion of the deployment.
    res.end(`Hello, World! I am deployed at https://${req.headers.host}${req.baseUrl}`);
};

autoserve(app);
