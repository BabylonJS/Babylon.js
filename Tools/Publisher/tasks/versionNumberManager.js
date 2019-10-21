// Dependecies.
const fs = require('fs-extra');
const path = require('path');
const colorConsole = require("../../NodeHelpers/colorConsole");

// Global Variables.
const config = require("../../Config/config.js");
const enginePath = path.join(config.core.computed.mainDirectory, "Engines/thinEngine.ts");

/**
 * Get the version from the engine class for Babylon
 */
function getEngineVersion() {
    colorConsole.log("Get version from thinEngine.ts", enginePath);
    const engineContent = fs.readFileSync(enginePath).toString();

    const versionRegex = new RegExp(`public static get Version\\(\\): string {\\s*return "(\\S*)";\\s*}`, "gm");
    const match = versionRegex.exec(engineContent);
    if (match && match.length) {
        const version = match[1];
        colorConsole.log("Version found: " + version.green);
        colorConsole.emptyLine();
        return version;
    }

    colorConsole.error("Version not found in thinEngine.ts");
    process.exit(1);
}

/**
 * Update the version in the engine class for Babylon
 */
function updateEngineVersion(newVersion) {
    colorConsole.log("Updating version in thinEngine.ts to: " + newVersion.green);
    let engineContent = fs.readFileSync(enginePath).toString();
    let replaced = engineContent.replace(/(public static get Version\(\): string {\s*return ")(.*)(";\s*})/g, "$1" + newVersion + "$3");
    replaced = replaced.replace(/(public static get NpmPackage\(\): string {\s*return ")(.*)(";\s*})/g, "$1" + "babylonjs@" + newVersion + "$3");
    fs.writeFileSync(enginePath, replaced);
    colorConsole.emptyLine();
}

/**
 * Update the root package.json version
 */
function updateRootPackageVersion(newVersion) {
    colorConsole.log("Updating version in /package.json to: " + newVersion.green);
    const packageJSONPath = config.core.computed.packageJSONPath;
    const packageJson = require(packageJSONPath);
    packageJson.version = newVersion;
    fs.writeFileSync(packageJSONPath, JSON.stringify(packageJson, null, 4));
    colorConsole.emptyLine();
}

module.exports = {
    getEngineVersion,
    updateEngineVersion,
    updateRootPackageVersion
};