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
    config.es6modules.forEach(moduleName => {
        if (moduleName === "sandbox") {
            // Do not publish apps
            return;
        }

        let module = config[moduleName];
        let es6Config = module.build.es6;

        colorConsole.log("Process " + "ES6".magenta + " Package: " + moduleName.blue.bold);

        let distPath = module.computed.distES6Directory;
        if (es6Config.packageBuildFolder) {
            distPath = path.join(distPath, es6Config.packageBuildFolder);
        }
        let packagePath = module.computed.packageES6Directory;
        let umdPackageJson = require(module.computed.packageJSONPath);

        colorConsole.log("    Cleanup " + packagePath.cyan);
        rmDir(packagePath);

        colorConsole.log("    Copy Dist folder " + distPath.cyan + " to " + packagePath.cyan);
        fs.copySync(distPath, packagePath);

        if (es6Config.requiredFiles) {
            es6Config.requiredFiles.forEach(file => {
                let source = path.join(config.computed.rootFolder, file);
                let destination = path.join(packagePath, path.basename(file));
                colorConsole.log("    Copy es6 required file: ", source.cyan, destination.cyan);
                fs.copySync(source, destination);
            });
        }

        if (es6Config.readme) {
            let source = path.join(config.computed.rootFolder, es6Config.readme);
            let destination = path.join(packagePath, "readme.md");
            colorConsole.log("    Copy es6 readme file: ", source.cyan, destination.cyan);
            fs.copySync(source, destination);
        }

        if (es6Config.license) {
            let source = path.join(config.computed.rootFolder, es6Config.readme);
            let destination = path.join(packagePath, "license.md");
            colorConsole.log("    Copy es6 license file: ", source.cyan, destination.cyan);
            fs.copySync(source, destination);
        }

        umdPackageJson.name = es6Config.packageName;
        umdPackageJson.version = version;
        umdPackageJson.main = es6Config.index || "index.js";
        umdPackageJson.module = es6Config.index || "index.js";
        umdPackageJson.esnext = es6Config.index || "index.js";
        umdPackageJson.typings = es6Config.typings || "index.d.ts";

        if (es6Config.packagesFiles) {
            umdPackageJson.files = es6Config.packagesFiles;
        }
        else {
            let files = getFiles(packagePath)
                .map(f => f.replace(packagePath + "/", ""))
                .filter(f => f.indexOf("assets/") === -1);
            umdPackageJson.files = files;
        }

        if (es6Config.license && umdPackageJson.files.indexOf("license.md") === -1) {
            umdPackageJson.files.push("license.md");
        }

        ["dependencies", "peerDependencies", "devDependencies"].forEach(key => {
            if (umdPackageJson[key]) {
                let dependencies = umdPackageJson[key];
                umdPackageJson[key] = {};
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
                        umdPackageJson[key][dependencyName] = version;
                    } else if (!module.isCore) {
                        umdPackageJson[key][packageName] = dependencies[packageName];
                    }
                });
            }
        });

        // Inject tslib as a dependency
        var mainPackageJSONPath = path.join(config.computed.rootFolder, "package.json");
        var mainPackageJSON = fs.readJSONSync(mainPackageJSONPath);
        var tslibSemver = mainPackageJSON["devDependencies"]["tslib"];
        colorConsole.log("    Adding tslib version: ", tslibSemver.yellow);
        umdPackageJson["dependencies"] = umdPackageJson["dependencies"] || {};
        umdPackageJson["dependencies"]["tslib"] = tslibSemver;

        let packageJSONPath = path.join(packagePath, "package.json");
        fs.writeFileSync(packageJSONPath, JSON.stringify(umdPackageJson, null, 4));

        publish(version, es6Config.packageName, packagePath, true);
        colorConsole.emptyLine();
    });
}

module.exports = processEs6Packages;