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
    const platformsByWeight = {};
    for (let platformName in platforms) {
        const platform = platforms[platformName];
        const sameWeightPlatforms = platformsByWeight[platform.weight] = platformsByWeight[platform.weight] || [];
        sameWeightPlatforms.push(platform);
    }
    const weightsList = [];
    for (let i in platformsByWeight) {
        weightsList.push(platformsByWeight[i][0].weight);
    }
    weightsList.sort();

    for (let weight of weightsList) {
        const sameWeightPlatforms = platformsByWeight[weight];
        const detectedPlatforms = [];
        for (let platform of sameWeightPlatforms) {
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
                });
                throw new Error(`Multiple platforms at weight ${weight} were detected. Only one platform may be detected for any given weight. Please adjust weights or fix false positives. Platforms: ${detectedPlatformsString}`);
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
        weight: 0,
    }, platform));

    if (!platform.name) {
        throw new Error('Platform is missing name.');
    }

    if ((platform.weight|0) !== platform.weight) {
        throw new Error(`Platform ${platform.name} weight “${platform.weight}”is not an integer.`);
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
