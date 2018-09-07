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
            './tests/validation/integration.js',
            './tests/build/test.js',
            './tests/validation/validation.js',
            { pattern: './tests/**/*', watched: false, included: false, served: true },
            { pattern: './dist/assets/**/*', watched: false, included: false, served: true },
        ],
        proxies: {
            '/tests/': '/base/tests/',
            '/dist/assets/': '/base//dist/assets/'
        },

        port: 1338,
        colors: true,
        autoWatch: false,
        singleRun: false,

        // level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_INFO,

        browserStack: {
            project: 'Babylon JS Validation Tests',
            video: false,
            debug: 'true',
            timeout: 1200,
            build: process.env.TRAVIS_BUILD_NUMBER,
            username: process.env.BROWSER_STACK_USERNAME,
            accessKey: process.env.BROWSER_STACK_ACCESS_KEY
        },
        customLaunchers: {
            bs_chrome_win: {
                base: 'BrowserStack',
                browser: 'Chrome',
                browser_version: '63.0',
                os: 'Windows',
                os_version: '10'
            },
            bs_edge_win: {
                base: 'BrowserStack',
                browser: 'Edge',
                browser_version: '16.0',
                os: 'Windows',
                os_version: '10'
            },
            bs_firefox_win: {
                base: 'BrowserStack',
                browser: 'Firefox',
                browser_version: '57.0',
                os: 'Windows',
                os_version: '10'
            },
            bs_chrome_android: {
                base: 'BrowserStack',
                os: 'Android',
                os_version: '8.0',
                device: 'Google Pixel',
                real_mobile: 'true'
            },
            bs_safari_ios: {
                base: 'BrowserStack',
                os: 'ios',
                os_version: '10.3',
                device: 'iPhone 7',
                real_mobile: 'true'
            }
        },
        browsers: ['bs_chrome_win'],
        reporters: ['dots', 'BrowserStack'],
        singleRun: true
    });
};
