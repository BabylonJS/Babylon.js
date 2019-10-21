// Dependecies.
const shelljs = require('shelljs');
const fs = require('fs-extra');
const path = require('path');
const colorConsole = require("../../NodeHelpers/colorConsole");

// Helpers.
const publish = require("../helpers/publish");
const getFiles = require("../helpers/getFiles");

// Global Variables.
const config = require("../../Config/config.js");

/**
 * Special treatment for umd viewer.
 */
function processUMDViewer(module, version) {

    let projectPath = '../../../Viewer';
    let buildPath = path.resolve(__dirname, projectPath + "/build/src/");

    if (module.build.umd.requiredFiles) {
        module.build.umd.requiredFiles.forEach(file => {
            let source = path.join(config.computed.rootFolder, file);
            let destination = path.join(buildPath, path.basename(file));
            colorConsole.log("    Copy required file: ", source.cyan, destination.cyan);
            fs.copySync(source, destination);
        });
    }

    // The viewer needs to be built using tsc on the viewer's main repository
    // build the viewer.
    colorConsole.log("    Executing " + ('tsc -p ' + projectPath).yellow);

    let tscCompile = shelljs.exec('tsc -p ' + projectPath, {
        cwd: path.resolve(__dirname)
    });
    if (tscCompile.code !== 0) {
        throw new Error("tsc compilation failed");
    }

    let packageJson = require(path.join(buildPath, 'package.json'));

    let files = getFiles(buildPath).map(f => f.replace(buildPath, "")).filter(f => f.indexOf("assets/") === -1);

    packageJson.files = files;
    packageJson.version = version;
    packageJson.module = "index.js";
    packageJson.main = "babylon.viewer.js";
    packageJson.typings = "index.d.ts";

    // Package dependencies version
    if (packageJson.dependencies) {
        Object.keys(packageJson.dependencies).forEach(key => {
            if (key.indexOf("babylonjs") !== -1) {
                packageJson.dependencies[key] = version;
            }
        });
    }

    fs.writeFileSync(path.join(buildPath, 'package.json'), JSON.stringify(packageJson, null, 4));

    publish(version, "viewer", buildPath);
    colorConsole.emptyLine();
}

module.exports = processUMDViewer;