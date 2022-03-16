// Dependecies.
const publisher = require('./tasks/main');
const minimist = require("minimist");

const commandLineOptions = minimist(process.argv.slice(2), {
    boolean: ["es6"],
    boolean: ["umd"]
});

if (commandLineOptions.es6) {
    publisher(false, {
        es6: true
    });
}
else if (commandLineOptions.umd) {
    publisher(false, {
        umd: true
    });
}
else {
    publisher(false);
}