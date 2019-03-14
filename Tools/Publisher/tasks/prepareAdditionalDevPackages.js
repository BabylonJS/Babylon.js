// Dependecies.
const fs = require('fs-extra');
const rmDir = require("../../NodeHelpers/rmDir");
const colorConsole = require("../../NodeHelpers/colorConsole");
var shelljs = require("shelljs");

// Global Variables.
const config = require("../../Config/config.js");

/**
 * Prepare a Additional Dev folder npm linked for test purpose.
 */
function prepareAdditionalDevPackages() {
    config.additionalNpmPackages.forEach(package => {
        colorConsole.log("Prepare " + "AdditionalDev".magenta + " Package: " + package.name.blue.bold);

        let packagePath = package.computed.path;
        let packageDevPath = package.computed.packageDevDirectory;

        colorConsole.log("    Cleanup " + packageDevPath.cyan);
        rmDir(packageDevPath);

        colorConsole.log("    Copy Package folder " + packagePath.cyan + " to " + packageDevPath.cyan);
        fs.copySync(packagePath, packageDevPath);

        colorConsole.log("    Execute Npm Link command");
        const command = `npm link`;
        const result = shelljs.exec(command, { 
            async: false,
            cwd: packageDevPath
        });

        if (result.code != 0) {
            throw "Failed to link the ES6 package."
        }

        colorConsole.emptyLine();
    });
}

module.exports = prepareAdditionalDevPackages;