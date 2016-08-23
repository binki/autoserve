Enable a webapp to get the optimal `http` implementation based on how
it is deployed. Also provide a way to get the `baseUrl` of the
deployment.

Ways one might deploy a node-based webapp:

* [http](https://nodejs.org/api/http.html)
* [node-fastcgi](https://github.com/fbbdev/node-fastcgi)
* CGI (in the future just as proof of concept, please don’t use in production)
* Passenger

# Usage

`script.cgi`:

    #!/usr/bin/env node
    'use strict';
    
    const httpAutodetect = require('http-autodetect');
    
    const app = function (req, res) {
        res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8', });
	// It is recommended to use a framework like express to calculate
	// the host and protocol of your deployment. getBaseUrl() only
	// solves the path portion of the deployment.
	res.end(`Hello, World! I am deployed at https://${req.headers.host}${httpAutodetect.getBaseUrl(req)}`);
    };
    
    httpAutodetect(app);

## Express Usage

You need extra middleware to get Express to respect
`getBaseUrl()`. See
[express-http-autodetect](https://github.com/binki/express-http-autodetect)
for that or use this snippet:

    const expressHttpAutodetect = require('express-http-autodetect');
    
    // If you followed the Express-4 migration guide or used
    // express-generator, your app definition will be its own
    // CommonJS module.
    const app = require('./app');
    
    expressHttpAutodetect(app);

Note the Connect is not supported as it does not have the concept of
managing `baseUrl`/mounting sub-apps. It only chains handlers and is
missing the sort of routing handling that proper `baseUrl` handling
requires.
