// Dependecies.
const fs = require('fs-extra');
const rmDir = require("../../NodeHelpers/rmDir");
const colorConsole = require("../../NodeHelpers/colorConsole");

// Global Variables.
const config = require("../../Config/config.js");

/**
 * Prepare an es6 Dev folder npm linked for test purpose.
 */
function prepareEs6DevPackages() {
    config.modules.forEach(moduleName => {
        let module = config[moduleName];
        let es6Config = module.build.es6;

        colorConsole.log("Prepare " + "ES6Dev".magenta + " Package: " + moduleName.blue.bold);

        let packagePath = module.computed.packageES6Directory;
        let packageDevPath = module.computed.packageES6DevDirectory;

        colorConsole.log("    Cleanup " + packageDevPath.cyan);
        rmDir(packageDevPath);

        colorConsole.log("    Copy Package folder " + packagePath.cyan + " to " + packageDevPath.cyan);
        fs.copySync(packagePath, packageDevPath);

        colorConsole.emptyLine();
    });
}

/**
 * Main function driving the publication.
 */
module.exports = prepareEs6DevPackages;