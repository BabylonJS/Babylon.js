// Dependecies.
const fs = require('fs-extra');
const path = require('path');
const rmDir = require("../../NodeHelpers/rmDir");
const colorConsole = require("../../NodeHelpers/colorConsole");
const shelljs = require("shelljs");

// Global Variables.
const config = require("../../Config/config.js");

/**
 * Prepare an es6 Dev folder npm linked for test purpose.
 */
function prepareEs6DevPackages() {
    config.es6modules.forEach(moduleName => {
        if (moduleName === "viewer" || moduleName === "sandbox") {
            // Do not publish locally as an es6 npm linked module
            return;
        }

        const module = config[moduleName];

        colorConsole.log("Prepare " + "ES6Dev".magenta + " Package: " + moduleName.blue.bold);

        const packagePath = module.computed.packageES6Directory;
        const packageDevPath = module.computed.packageES6DevDirectory;

        colorConsole.log("    Cleanup " + packageDevPath.cyan);
        rmDir(packageDevPath);

        colorConsole.log("    Copy Package folder " + packagePath.cyan + " to " + packageDevPath.cyan);
        fs.copySync(packagePath, packageDevPath);

        const packageES6DevJSONPath = path.join(packageDevPath, "package.json");
        const packageES6DevJSON = require(packageES6DevJSONPath);
        for (let dependency in packageES6DevJSON.dependencies) {
            if (dependency.indexOf("babylon") > -1) {
                colorConsole.log("    Execute Npm Link " + dependency.yellow);
                const command = `npm link ${dependency}`;
                const result = shelljs.exec(command, { 
                    async: false,
                    cwd: packageDevPath
                });

                if (result.code != 0) {
                    throw "Failed to link the ES6 package."
                }
            }
        }

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

module.exports = prepareEs6DevPackages;