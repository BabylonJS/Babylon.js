// Dependecies.
const fs = require('fs-extra');
const path = require('path');
const rmDir = require("../../NodeHelpers/rmDir");
const colorConsole = require("../../NodeHelpers/colorConsole");
const shelljs = require("shelljs");

// Global Variables.
const config = require("../../Config/config.js");

/**
 * Prepare a UMD Dev folder npm linked for test purpose.
 */
function prepareUMDDevPackages() {
    config.modules.forEach(moduleName => {
        if (moduleName === "sandbox") {
            // Do not publish apps
            return;
        }
        let module = config[moduleName];

        colorConsole.log("Prepare " + "UMDDev".magenta + " Package: " + moduleName.blue.bold);

        let packagePath = module.computed.packageUMDDirectory;
        let packageDevPath = module.computed.packageUMDDevDirectory;

        colorConsole.log("    Cleanup " + packageDevPath.cyan);
        rmDir(packageDevPath);

        colorConsole.log("    Copy Package folder " + packagePath.cyan + " to " + packageDevPath.cyan);
        fs.copySync(packagePath, packageDevPath);

        const packageUMDDevJSONPath = path.join(packageDevPath, "package.json");
        const packageUMDDevJSON = require(packageUMDDevJSONPath);
        for (let dependency in packageUMDDevJSON.dependencies) {
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

module.exports = prepareUMDDevPackages;