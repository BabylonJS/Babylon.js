// Dependecies.
const fs = require('fs-extra');
const rmDir = require("../../NodeHelpers/rmDir");
const colorConsole = require("../../NodeHelpers/colorConsole");

// Global Variables.
const config = require("../../Config/config.js");

/**
 * Prepare a UMD Dev folder npm linked for test purpose.
 */
function prepareUMDDevPackages() {
    config.modules.forEach(moduleName => {
        let module = config[moduleName];
        let umdConfig = module.build.umd;

        colorConsole.log("Prepare " + "UMDDev".magenta + " Package: " + moduleName.blue.bold);

        let packagePath = module.computed.packageUMDDirectory;
        let packageDevPath = module.computed.packageUMDDevDirectory;

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
module.exports = prepareUMDDevPackages;