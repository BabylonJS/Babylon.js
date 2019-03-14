var supportsColor = require('color-support');

var hasColors = supportsColor();

var styles = {
    black: hasColors ? '\x1b[30m' : '',
    red: hasColors ? '\x1b[31m' : '',
    green: hasColors ? '\x1b[32m' : '',
    yellow: hasColors ? '\x1b[33m' : '',
    blue: hasColors ? '\x1b[34m' : '',
    magenta: hasColors ? '\x1b[35m' : '',
    cyan: hasColors ? '\x1b[36m' : '',
    gray: hasColors ? '\x1b[90m' : '',
    white: hasColors ? '\x1b[97m' : '',

    bgBlack: hasColors ? '\x1b[40m' : '',
    bgRed: hasColors ? '\x1b[41m' : '',
    bgGreen: hasColors ? '\x1b[42m' : '',
    bgYellow: hasColors ? '\x1b[43m' : '',
    bgBlue: hasColors ? '\x1b[44m' : '',
    bgMagenta: hasColors ? '\x1b[45m' : '',
    bgCyan: hasColors ? '\x1b[46m' : '',
    bgWhite: hasColors ? '\x1b[47m' : '',

    bold: hasColors ? '\x1b[1m' : '',
    italic: hasColors ? '\x1b[3m' : '',
    underline: hasColors ? '\x1b[4m' : '',
    strikethrough: hasColors ? '\x1b[9m' : '',
}

var clear = hasColors ? '\x1b[0m' : '';

var currentColor = undefined;

function getTimestamp() {
    var time = new Date();
    var timeInString = ("0" + time.getHours()).slice(-2) + ":" +
        ("0" + time.getMinutes()).slice(-2) + ":" +
        ("0" + time.getSeconds()).slice(-2);

    if (currentColor) {
        return styles.white + '[' + currentColor + timeInString + clear + styles.white + ']';
    }
    else {
        return styles.white + '[' + styles.gray + timeInString + styles.white + ']';
    }
}

function log() {
    currentColor = styles.gray;
    var time = getTimestamp();
    process.stdout.write(time + ' ');
    currentColor = undefined;

    console.log.apply(console, arguments);
    return this;
}

function warn() {
    currentColor = styles.yellow;
    var time = getTimestamp();
    process.stdout.write(time + ' ');
    currentColor = undefined;

    console.warn.apply(console, arguments);
    return this;
}

function err() {
    currentColor = styles.red;
    var time = getTimestamp();
    process.stderr.write(time + ' ');
    currentColor = undefined;

    console.error.apply(console, arguments);
    return this;
}

function success() {
    currentColor = styles.green;
    var time = getTimestamp();
    process.stdout.write(time + ' ');
    currentColor = undefined;

    console.log.apply(console, arguments);
    return this;
}

function emptyLine() {
    console.log();
}

for (let style in styles) {
    Object.defineProperty(String.prototype, style, {
        get: function() {
            return styles[style] + this + clear;
        },
        enumerable: true,
        configurable: true
    });
}

module.exports = {
    log,
    warn,
    error: err,
    success,
    emptyLine
};