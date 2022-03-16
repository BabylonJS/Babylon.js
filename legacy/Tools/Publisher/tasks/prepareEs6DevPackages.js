// Dependecies.
const fs = require('fs-extra');
const minimist = require("minimist");
const path = require('path');
const rmDir = require("../../NodeHelpers/rmDir");
const colorConsole = require("../../NodeHelpers/colorConsole");
const shelljs = require("shelljs");

// Global Variables.
const config = require("../../Config/config.js");

// Parse Command Line.
const commandLineOptions = minimist(process.argv.slice(2), {
    boolean: ["noGlobalInstall"],
});

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

        if (!commandLineOptions.noGlobalInstall) {
            const packageES6DevJSONPath = path.join(packageDevPath, "package.json");
            const packageES6DevJSON = require(packageES6DevJSONPath);

            const savedShellConfig = {...shelljs.config};
            try {
                Object.assign(shelljs.config, {verbose: true, silent: false, fatal: true});

                for (let dependency in packageES6DevJSON.dependencies) {
                    if (dependency.indexOf("babylon") > -1) {
                        colorConsole.log(`    Add Dependency Link (npm link ${dependency.yellow})`);
                        
                        shelljs.exec(`npm link ${dependency}`, {cwd: packageDevPath});
                    }
                }

                colorConsole.log("    Install Global Package Link (npm link)");
                shelljs.exec('npm link', {cwd: packageDevPath});
            }
            finally {
                Object.assign(shelljs.config, savedShellConfig);
            }
        }

        colorConsole.emptyLine();
    });
}

module.exports = prepareEs6DevPackages;
