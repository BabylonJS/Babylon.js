module.exports = function (config) {
    config.set({
        basePath: '../',
        captureTimeout: 3e5,
        browserNoActivityTimeout: 3e5,
        browserDisconnectTimeout: 3e5,
        browserDisconnectTolerance: 3,
        concurrency: 1,

        urlRoot: '/karma/',

        frameworks: ['mocha', 'chai', 'sinon'],

        files: [
            './tests/build/*.js',
            { pattern: './tests/**/*', watched: false, included: false, served: true },
        ],
        proxies: {
            '/tests/': '/base/tests/'
        },
        client: {
            mocha: {
                timeout: 10000
            }
        },

        port: 3000,
        colors: true,
        autoWatch: false,
        singleRun: true,
        browserNoActivityTimeout: 20000,

        // level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_INFO,

        browsers: ['ChromeHeadless']
    })
}