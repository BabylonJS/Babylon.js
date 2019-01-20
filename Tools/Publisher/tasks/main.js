// Dependecies.
const prompt = require('prompt');
const path = require('path');
const colorConsole = require("../../NodeHelpers/colorConsole");

// Helpers.
const versionNumberManager = require("./versionNumberManager");
const buildBabylonJSAndDependencies = require("./buildBabylonJSAndDependencies");
const processAdditionalPackages = require("./processAdditionalPackages");
const processUMDPackages = require("./processUMDPackages");
const processEs6Packages = require("./processEs6Packages");
const prepareUMDDevPackages = require("./prepareUMDDevPackages");
const prepareEs6DevPackages = require("./prepareEs6DevPackages");
const prepareAdditionalDevPackages = require("./prepareAdditionalDevPackages");

// Path management.
process.env.PATH += (path.delimiter + path.join(__dirname, '../node_modules', '.bin'));

const createVersion = function(version, options) {
    options = options || {
        umd: true,
        es6: true
    };

    // Publish additional packages from the config.
    processAdditionalPackages(version);
    prepareAdditionalDevPackages();

    if (options.umd) {
        // Create the packages and publish if needed.
        processUMDPackages(version);
        // Prepare umd Dev Folder.
        prepareUMDDevPackages();
    }

    if (options.es6) {
        // Create the packages and publish if needed.
        processEs6Packages(version);
        // Prepare es6 Dev Folder.
        prepareEs6DevPackages();
    }
}

/**
 * Main function driving the publication.
 */
module.exports = function(production, options) {
    if (production) {
        prompt.start();

        prompt.get(['version'], function (err, result) {
            const version = result.version;

            // Update the engine version if needed.
            if (!version || !version.length) {
                colorConsole.error("New version required.");
                Process.exit(1);
                return;
            }

            versionNumberManager.updateEngineVersion(version);
            buildBabylonJSAndDependencies();
            versionNumberManager.updateRootPackageVersion(version);

            process.env.BABYLONJSREALPUBLISH = true;

            createVersion(version, options);

            // Invite user to tag with the new version.
            colorConsole.log("Done, please tag git with " + version);
        });
    }
    else {
        const version = versionNumberManager.getEngineVersion();
        createVersion(version, options);
    }
};