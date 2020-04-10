var baseConfig = require('../../../tests/karma-browsers.config')

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
            '/dist/assets/': '/base/dist/assets/'
        },

        port: 3000,
        colors: true,
        autoWatch: false,
        singleRun: false,

        // level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_INFO,

        reporters: ['progress', 'junit'],

        plugins: [
            'karma-mocha',
            'karma-chai',
            'karma-sinon',
            'karma-chrome-launcher',
            'karma-firefox-launcher',

            require('../../../Tools/Gulp/helpers/gulp-karmaJunitPlugin')
        ],

        junitReporter: {
            outputDir: '../.temp/testResults', // results will be saved as $outputDir/$browserName.xml
            outputFile: 'ViewerValidationTests.xml', // if included, results will be saved as $outputDir/$browserName/$outputFile
            suite: 'Viewer Validation Tests', // suite will become the package name attribute in xml testsuite element
            useBrowserName: false, // add browser name to report and classes names
            nameFormatter: undefined, // function (browser, result) to customize the name attribute in xml testcase element
            classNameFormatter: undefined, // function (browser, result) to customize the classname attribute in xml testcase element
            properties: {} // key value pair of properties to add to the <properties> section of the report
        },

        ...baseConfig
    });
};