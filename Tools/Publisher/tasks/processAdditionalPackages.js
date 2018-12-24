// Dependecies.
const fs = require('fs-extra');
const path = require('path');
const colorConsole = require("../../NodeHelpers/colorConsole");

// Helpers.
const publish = require("../helpers/publish");

// Global Variables.
const config = require("../../Config/config.js");

/**
 * Process Additional Packages.
 */
function processAdditionalPackages(version) {
    config.additionalNpmPackages.forEach(package => {
        colorConsole.log("Process " + "Additional".magenta + " Package: " + package.name.blue.bold);

        let packageJson = require(package.computed.path + '/package.json');
        packageJson.version = version;

        colorConsole.log("    Update package version to: " + version.green);
        fs.writeFileSync(path.join(package.computed.path, 'package.json'), JSON.stringify(packageJson, null, 4));

        publish(version, package.name, package.computed.path);

        colorConsole.emptyLine();
    });
}

module.exports = processAdditionalPackages;