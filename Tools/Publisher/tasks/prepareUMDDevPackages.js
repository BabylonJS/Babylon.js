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

        if (!commandLineOptions.noGlobalInstall) {
            const packageUMDDevJSONPath = path.join(packageDevPath, "package.json");
            const packageUMDDevJSON = require(packageUMDDevJSONPath);

            const savedShellConfig = {...shelljs.config};
            try {
                Object.assign(shelljs.config, {verbose: true, silent: false, fatal: true});

                for (let dependency in packageUMDDevJSON.dependencies) {
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

module.exports = prepareUMDDevPackages;
