// Dependecies.
const fs = require('fs-extra');
const path = require('path');
const rmDir = require("../../NodeHelpers/rmDir");
const colorConsole = require("../../NodeHelpers/colorConsole");

// Helpers.
const publish = require("../helpers/publish");
const processLegacyViewer = require("./processLegacyViewer");

// Global Variables.
const config = require("../../Config/config.js");
const modules = config.modules.concat(config.viewerModules);

/**
 * Process Legacy Packages.
 */
function processLegacyPackages(version) {
    modules.forEach(moduleName => {
        let module = config[moduleName];
        colorConsole.log("Process " + "UMD".magenta + " Package: " + moduleName.blue.bold);

        if (moduleName === "viewer") {
            processLegacyViewer(module, version);
        }
        else {
            let outputDirectory = module.build.legacyPackageOutputDirectory || module.computed.distDirectory;

            if (module.build.requiredFiles) {
                module.build.requiredFiles.forEach(file => {
                    let source = path.join(config.computed.rootFolder, file);
                    let destination = path.join(outputDirectory, path.basename(file));
                    colorConsole.log("    Copy required file: ", source.cyan, destination.cyan);
                    fs.copySync(source, destination);
                });
            }

            // Package version
            const packageJSONPath = module.computed ?
                module.computed.packageJSONPath :
                outputDirectory + '/package.json';
            let packageJson = require(packageJSONPath);
            colorConsole.log("    Update package version to: " + version.green);
            packageJson.version = version;

            // Package dependencies version
            if (module.build.umd.dependencies) {
                packageJson.dependencies = module.build.umd.dependencies;
            }

            // Package dependencies version
            if (packageJson.dependencies) {
                Object.keys(packageJson.dependencies).forEach(key => {
                    if (key.indexOf("babylonjs") !== -1) {
                        packageJson.dependencies[key] = version;
                    }
                });
            }

            // Package dev dependencies
            if (module.build.umd.devDependencies) {
                packageJson.devDependencies = module.build.umd.devDependencies;
            }

            // Typings
            if (module.build.umd.typings) {
                packageJson.typings = module.build.umd.typings;
            }

            // Main
            if (module.build.umd.index) {
                packageJson.main = module.build.umd.index;
                packageJson.module = module.build.umd.index;
                packageJson.esnext = module.build.umd.index;
            }

            // Files
            if (module.build.umd.pacakagesFiles) {
                packageJson.files = module.build.umd.pacakagesFiles;
            }

            // Write to disk output directory
            fs.writeFileSync(path.join(outputDirectory, 'package.json'), JSON.stringify(packageJson, null, 4));

            if (!module.build.legacyPackageOutputDirectory) {
                let packageUMDPath = module.computed.packageUMDDirectory;
                colorConsole.log("    Cleanup " + packageUMDPath.cyan);
                rmDir(packageUMDPath);

                if (module.build.umd.pacakagesFiles) {
                    fs.ensureDirSync(packageUMDPath);
                    for (let file of module.build.umd.pacakagesFiles.concat(["package.json"])) {
                        let source = path.join(outputDirectory, file);
                        let destination = path.join(packageUMDPath, path.basename(file));
                        colorConsole.log("    Copy Package file: ", source.cyan, destination.cyan);
                        fs.copyFileSync(source, destination);
                    }
                }
                else {
                    colorConsole.log("    Copy Package folder " + outputDirectory.cyan + " to " + packageUMDPath.cyan);
                    fs.copySync(outputDirectory, packageUMDPath);
                }
                publish(version, moduleName, packageUMDPath);
            }
            else {
                publish(version, moduleName, outputDirectory);
            }

            colorConsole.emptyLine();
        }
    });
}

/**
 * Main function driving the publication.
 */
module.exports = processLegacyPackages;