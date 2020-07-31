var baseConfig = require('../karma-browsers.config')

module.exports = function (config) {
    'use strict';
    config.set({

        basePath: '../../',
        captureTimeout: 3e5,
        browserNoActivityTimeout: 3e5,
        browserDisconnectTimeout: 3e5,
        browserDisconnectTolerance: 3,
        concurrency: 1,

        urlRoot: '/karma',

        frameworks: ['mocha', 'chai', 'sinon'],

        files: [
            'https://cdnjs.cloudflare.com/ajax/libs/seedrandom/3.0.5/seedrandom.min.js',
            '!./**/*.d.ts',
            './dist/preview release/earcut.min.js',
            './Tools/DevLoader/BabylonLoader.js',
            './tests/validation/index.css',
            './tests/validation/integration.js',
            './favicon.ico',
            { pattern: 'dist/preview release/**/*.js', watched: false, included: false, served: true },
            { pattern: 'dist/preview release/**/*.wasm', watched: false, included: false, served: true },
            { pattern: 'assets/**/*', watched: false, included: false, served: true },
            { pattern: 'tests/**/*', watched: false, included: false, served: true },
            { pattern: 'Playground/scenes/**/*', watched: false, included: false, served: true },
            { pattern: 'Playground/textures/**/*', watched: false, included: false, served: true },
            { pattern: 'Playground/sounds/**/*', watched: false, included: false, served: true },
            { pattern: 'Tools/Config/config.json', watched: false, included: false, served: true },
        ],
        proxies: {
            '/': '/base/'
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

            require('../../Tools/Gulp/helpers/gulp-karmaJunitPlugin')
        ],

        junitReporter: {
            outputDir: '.temp/testResults', // results will be saved as $outputDir/$browserName.xml
            outputFile: 'ValidationTests2.xml', // if included, results will be saved as $outputDir/$browserName/$outputFile
            suite: 'Validation Tests WebGL2', // suite will become the package name attribute in xml testsuite element
            useBrowserName: false, // add browser name to report and classes names
            nameFormatter: undefined, // function (browser, result) to customize the name attribute in xml testcase element
            classNameFormatter: undefined, // function (browser, result) to customize the classname attribute in xml testcase element
            properties: {} // key value pair of properties to add to the <properties> section of the report
        },
        ...baseConfig

    });
};