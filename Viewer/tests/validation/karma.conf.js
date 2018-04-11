module.exports = function (config) {
    'use strict';
    config.set({

        basePath: '../../',
        captureTimeout: 3e5,
        browserNoActivityTimeout: 3e5,
        browserDisconnectTimeout: 3e5,
        browserDisconnectTolerance: 3,
        concurrency: 1,

        urlRoot: '/karma/',

        frameworks: ['mocha', 'chai', 'sinon'],

        files: [
            './tests/validation/index.css',
            '../dist/preview release/viewer/babylon.viewer.max.js',
            './tests/validation/integration.js',
            './tests/validation/validation.js',
            { pattern: './tests/**/*', watched: false, included: false, served: true },
            { pattern: '../dist/**/*', watched: false, included: false, served: true },
        ],
        proxies: {
            '/tests/': '/base/tests/'
        },

        port: 3000,
        colors: true,
        autoWatch: false,
        singleRun: false,

        // level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_INFO,

        browsers: ['Chrome']

    });
};