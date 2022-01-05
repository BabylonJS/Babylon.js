// Dependecies.
const fs = require('fs-extra');
const minimist = require("minimist");
const rmDir = require("../../NodeHelpers/rmDir");
const colorConsole = require("../../NodeHelpers/colorConsole");
var shelljs = require("shelljs");

// Global Variables.
const config = require("../../Config/config.js");

// Parse Command Line.
const commandLineOptions = minimist(process.argv.slice(2), {
    boolean: ["noGlobalInstall"],
});

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

        if (!commandLineOptions.noGlobalInstall) {
            colorConsole.log("    Install Global Package Link (npm link)");

            const savedShellConfig = {...shelljs.config};
            try {
                Object.assign(shelljs.config, {verbose: true, silent: false, fatal: true});
                shelljs.exec('npm link', {cwd: packageDevPath});
            }
            finally {
                Object.assign(shelljs.config, savedShellConfig);
            }
        }

        colorConsole.emptyLine();
    });
}

module.exports = prepareAdditionalDevPackages;
