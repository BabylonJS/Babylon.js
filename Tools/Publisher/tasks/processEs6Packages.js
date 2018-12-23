// Dependecies.
const fs = require('fs-extra');
const path = require('path');
const rmDir = require("../../NodeHelpers/rmDir");
const colorConsole = require("../../NodeHelpers/colorConsole");

// Helpers.
const publish = require("../helpers/publish");
const getFiles = require("../helpers/getFiles");

// Global Variables.
const config = require("../../Config/config.js");
const modules = config.modules.concat(config.viewerModules);

/**
 * Process ES6 Packages.
 */
function processEs6Packages(version) {
    config.modules.forEach(moduleName => {
        let module = config[moduleName];
        let es6Config = module.build.es6;

        colorConsole.log("Process " + "ES6".magenta + " Package: " + moduleName.blue.bold);

        let distPath = module.computed.distES6Directory;
        let packagePath = module.computed.packageES6Directory;
        let legacyPackageJson = require(module.computed.packageJSONPath);

        colorConsole.log("    Cleanup " + packagePath.cyan);
        rmDir(packagePath);

        colorConsole.log("    Copy Dist folder " + distPath.cyan + " to " + packagePath.cyan);
        fs.copySync(distPath, packagePath);

        if (module.build.requiredFiles) {
            module.build.requiredFiles.forEach(file => {
                let source = path.join(config.computed.rootFolder, file);
                let destination = path.join(packagePath, path.basename(file));
                colorConsole.log("    Copy required file: ", source.cyan, destination.cyan);
                fs.copySync(source, destination);
            });
        }
        if (es6Config.requiredFiles) {
            es6Config.requiredFiles.forEach(file => {
                let source = path.join(config.computed.rootFolder, file);
                let destination = path.join(packagePath, path.basename(file));
                colorConsole.log("    Copy es6 required file: ", source.cyan, destination.cyan);
                fs.copySync(source, destination);
            });
        }

        legacyPackageJson.name = es6Config.packageName;
        legacyPackageJson.version = version;
        legacyPackageJson.main = es6Config.index || "index.js";
        legacyPackageJson.module = es6Config.index || "index.js";
        legacyPackageJson.esnext = es6Config.index || "index.js";
        legacyPackageJson.typings = es6Config.typings || "index.d.ts";

        if (es6Config.pacakagesFiles) {
            legacyPackageJson.files = es6Config.pacakagesFiles;
        }
        else {
            let files = getFiles(packagePath)
                .map(f => f.replace(packagePath + "/", ""))
                .filter(f => f.indexOf("assets/") === -1);
            legacyPackageJson.files = files;
        }

        ["dependencies", "peerDependencies", "devDependencies"].forEach(key => {
            if (legacyPackageJson[key]) {
                let dependencies = legacyPackageJson[key];
                legacyPackageJson[key] = {};
                Object.keys(dependencies).forEach(packageName => {
                    if (packageName.indexOf("babylonjs") !== -1) {
                        colorConsole.log("    Checking Internal Dependency: " + packageName.cyan);
                        let dependencyName = packageName;
                        for (var moduleName of modules) {
                            if (config[moduleName] && config[moduleName].build.umd && config[moduleName].build.umd.packageName === packageName) {
                                if (config[moduleName].build.es6) {
                                    dependencyName = config[moduleName].build.es6.packageName;
                                    colorConsole.log("    Replace Dependency: " + packageName.cyan + " by " + dependencyName.cyan);
                                    break;
                                }
                            }
                        }
                        legacyPackageJson[key][dependencyName] = version;
                    } else if (!module.isCore) {
                        legacyPackageJson[key][packageName] = dependencies[packageName];
                    }
                });
            }
        });

        // Inject tslib as a dependency
        var mainPackageJSONPath = path.join(config.computed.rootFolder, "package.json");
        var mainPackageJSON = fs.readJSONSync(mainPackageJSONPath);
        var tslibSemver = mainPackageJSON["devDependencies"]["tslib"];
        colorConsole.log("    Adding tslib version: ", tslibSemver.yellow);
        legacyPackageJson["dependencies"]["tslib"] = tslibSemver;

        let packageJSONPath = path.join(packagePath, "package.json");
        fs.writeFileSync(packageJSONPath, JSON.stringify(legacyPackageJson, null, 4));

        publish(version, es6Config.packageName, packagePath, true);
        colorConsole.emptyLine();
    });
}

/**
 * Main function driving the publication.
 */
module.exports = processEs6Packages;