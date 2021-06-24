// Import Dependencies.
const gulp = require("gulp");
const minimist = require("minimist");
const path = require("path");
const fs = require("fs-extra");
const shelljs = require('shelljs');

// Import Helpers.
const colorConsole = require("../../NodeHelpers/colorConsole");

// Read the full config.
var config = require("../../Config/config.js");

// Parse Command Line.
const commandLineOptions = minimist(process.argv.slice(2), {
    boolean: ["noGlobalInstall"],
});

// Base Line Path.
var baseLinePath = path.resolve(config.computed.rootFolder, "dist/preview release/packagesSizeBaseLine.json");
var es6TestsFolder = path.resolve(config.computed.rootFolder, "tests/es6Modules");
var es6TestsWebpackFile = path.resolve(es6TestsFolder, "webpack.config.js");

/**
 * Launches the ES6 modules tests to evaluate the min package size.
 */
gulp.task("tests-es6Modules", function(done) {
    const savedShellConfig = {...shelljs.config};
    try {
        Object.assign(shelljs.config, {verbose: true, silent: false, fatal: true});

        if (commandLineOptions.noGlobalInstall) {
            colorConsole.log("Link to dev copy of built modules");
            const coreDevDir = config.core.computed.packageES6DevDirectory;
            const materialsDevDir = config.materialsLibrary.computed.packageES6DevDirectory;
            shelljs.exec(`npm install --no-save "${coreDevDir}"`, {cwd: es6TestsFolder});
            shelljs.exec(`npm install --no-save "${materialsDevDir}"`, {cwd: es6TestsFolder});
        } else {
            colorConsole.log("Link to installed copy of built modules");
            shelljs.exec("npm link @babylonjs/core", {cwd: es6TestsFolder});
            shelljs.exec("npm link @babylonjs/materials", {cwd: es6TestsFolder});
        }

        colorConsole.log("Bundle test app with webpack");
        webpack_result = shelljs.exec("npx webpack", {cwd: es6TestsFolder});
        if (webpack_result.stdout)
            colorConsole.error(`webpack stdout:\n${webpack_result.stdout}`);
        if (webpack_result.stderr)
            colorConsole.error(`webpack stderr:\n${webpack_result.stderr}`);
    }
    finally {
        Object.assign(shelljs.config, savedShellConfig);
    }

    colorConsole.log("Gather output size");
    var testsBaseLine = fs.readJSONSync(baseLinePath);
    var webpackConfig = require(es6TestsWebpackFile);
    for (let entryName in webpackConfig.entry) {
        let entry = webpackConfig.entry[entryName];
        entry = entry.replace(".ts", ".js");
        entry = path.basename(entry);
        let outputPath = path.resolve(config.computed.tempFolder, 'testsES6Modules', entry);
        let stats = fs.statSync(outputPath);
        let size = stats.size;

        if (testsBaseLine && testsBaseLine[entryName] && size > (testsBaseLine[entryName] + 10000)) {
            colorConsole.error(`New size: ${(""+size).cyan} bytes is bigger than baseline size : ${testsBaseLine[entryName]} bytes on ${entryName}.`);
            throw "Bigger than baseline";
        }
        testsBaseLine[entryName] = size;
    }

    for (let entryName in testsBaseLine) {
        colorConsole.success(`Baseline size for ${entryName.yellow} is ${(""+testsBaseLine[entryName]).cyan} bytes.`);
    }

    colorConsole.log("Save baseline");
    fs.writeJSONSync(baseLinePath, testsBaseLine);

    done();
});

/**
 * Launches the ES6 modules tests to evaluate the min package size.
 */
gulp.task("deployAndTests-es6Modules", gulp.series("localdev-es6", "tests-es6Modules"));


/**
 * Launches the ES6 modules tests to evaluate the min package size.
 */
gulp.task("buildAndTests-es6Modules", gulp.series("npmPackages-es6", "deployAndTests-es6Modules"));
