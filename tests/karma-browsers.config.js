var env = process.env

module.exports = {
    browsers:  env.BROWSER ? env.BROWSER.split(',') : ['ChromeHeadless'],
    customLaunchers: {
        Chrome_Without_Sandbox: {
            base: 'Chrome',
            flags: ['--no-sandbox', '--disable-setuid-sandbox'],
        },
    },
}