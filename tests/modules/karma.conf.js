var baseConfig = require('../karma-browsers.config')

module.exports = function (config) {
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
            './tests/modules/tests-karma.js',
            // load the latest build
            { pattern: './tests/modules/build/dependencies/**/*.js', watched: false, included: true, served: true },
            './tests/modules/build/tests-loader.js',
            { pattern: 'assets/**/*', watched: false, included: false, served: true },
            { pattern: 'Playground/scenes/**/*', watched: false, included: false, served: true },
            { pattern: 'Playground/textures/**/*', watched: false, included: false, served: true },
            { pattern: 'Playground/sounds/**/*', watched: false, included: false, served: true }
        ],
        proxies: {
            '/': '/base/'
        },

        port: 3000,
        colors: true,
        autoWatch: false,
        singleRun: true,

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
            outputFile: 'ModuleTests.xml', // if included, results will be saved as $outputDir/$browserName/$outputFile
            suite: 'Module Tests', // suite will become the package name attribute in xml testsuite element
            useBrowserName: false, // add browser name to report and classes names
            nameFormatter: undefined, // function (browser, result) to customize the name attribute in xml testcase element
            classNameFormatter: undefined, // function (browser, result) to customize the classname attribute in xml testcase element
            properties: {} // key value pair of properties to add to the <properties> section of the report
        },
        ...baseConfig
    })
}