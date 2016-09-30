'use strict';

var fs = require('fs');
var process = require('process');

const platforms = {};

module.exports = function (app) {
    const detectedPlatform = module.exports.detect();
    if (!detectedPlatform) {
        throw new Error('No supported platform detected.');
    }
    detectedPlatform.serve(app);
};

module.exports.detect = function () {
    const platformsByPriority = {};
    for (let platformName in platforms) {
        const platform = platforms[platformName];
        const samePriorityPlatforms = platformsByPriority[platform.priority] = platformsByPriority[platform.priority] || [];
        samePriorityPlatforms.push(platform);
    }
    const prioritysList = [];
    for (let i in platformsByPriority) {
        prioritysList.push(platformsByPriority[i][0].priority);
    }
    // sort() is not numerical by default. Note we sort descending so
    // high priority values get visited first.
    prioritysList.sort((a, b) => b - a);

    for (let priority of prioritysList) {
        const samePriorityPlatforms = platformsByPriority[priority];
        const detectedPlatforms = [];
        for (let platform of samePriorityPlatforms) {
            if (platform.detect()) {
                detectedPlatforms.push(platform);
            }
        }
        if (detectedPlatforms.length) {
            if (detectedPlatforms.length > 1) {
                const detectedPlatformsString = detectedPlatforms.reduce(function (s, platform) {
                    if (s) {
                        s += ', ';
                    }
                    return s + platform.name;
                }, '');
                throw new Error(`Multiple platforms at priority ${priority} were detected. Only one platform may be detected for any given priority. Please adjust prioritys or fix false positives. Platforms: ${detectedPlatformsString}`);
            }
            // Produce the polished “platform” which sets
            // request.baseUrl. This might cause confusion because
            // detect() returns a “platform” that behaves differently
            // from the “platform” you would register via register()…
            const detectedPlatform = detectedPlatforms[0];
            const detectedPlatformServe = detectedPlatform.serve;
            return Object.assign({}, detectedPlatform, {
                serve: function (app) {
                    detectedPlatformServe.call(this, function (req, res) {
                        if (!req.baseUrl) {
                            req.baseUrl = detectedPlatform.getBaseUrl(req);
                        }
                        return app(req, res);
                    });
                },
            });
        }
    }
};

module.exports.platforms = Object.freeze(Object.create(platforms));

module.exports.register = function (platform) {
    platform = Object.freeze(Object.assign({
        getBaseUrl: function () {
            return '/';
        },
        // Provide options as a mutable object so that, e.g., a
        // deployment script could set up a custom platform and set
        // options on it before launching the autoserve-supporting
        // app.
        options: {},
        priority: 0,
    }, platform));

    if (!platform.name) {
        throw new Error('Platform is missing name.');
    }

    if ((platform.priority|0) !== platform.priority) {
        throw new Error(`Platform ${platform.name} priority “${platform.priority}”is not an integer.`);
    }

    for (let requiredFunction of [
        'detect',
        'serve',
    ]) {
        if (typeof platform[requiredFunction] !== 'function') {
            throw new Error(`Platform ${platform.name} is missing ${requiredFunction}().`);
        }
    }
    platforms[platform.name] = platform;
};

module.exports.serve = module.exports;

Object.freeze(module.exports);

// Register core/built-in platforms.
for (let platformName of [
    'http',
    'passenger',
]) {
    module.exports.register(require(`./platform/${platformName}`));
}
for (let platformModuleName of [
    'autoserve-platform-node-fastcgi',
]) {
    // Conditionally require() to support optional dependencies.
    // http://stackoverflow.com/a/21740407/429091
    let platform;
    try {
        platform = require(platformModuleName);
    } catch (ex) {
    }
    if (platform) {
        module.exports.register(platform);
    }
}
