// Dependecies.
const prompt = require('prompt');
const shelljs = require('shelljs');
const fs = require('fs-extra');
const path = require('path');
const rmDir = require("../NodeHelpers/rmDir");
const colorConsole = require("../NodeHelpers/colorConsole");

// CMD Arguments Management.
let doNotBuild = false;
let doNotPublish = false;

// Path management.
process.env.PATH += (path.delimiter + path.join(__dirname, 'node_modules', '.bin'));

// Global Variables.
const config = require("../Config/config.js");
const modules = config.modules.concat(config.viewerModules);
const basePath = config.build.outputDirectory;
const enginePath = path.join(config.core.computed.srcDirectory, "Engines/engine.ts");

/**
 * Get Files from folder.
 */
const getFiles = function(dir, files_) {
    files_ = files_ || [];
    var files = fs.readdirSync(dir);
    for (var i in files) {
        var name = dir + '/' + files[i];
        if (fs.statSync(name).isDirectory()) {
            getFiles(name, files_);
        } else {
            files_.push(name);
        }
    }
    return files_;
}

/**
 * Update the version in the engine class for Babylon
 */
function updateEngineVersion(newVersion) {
    colorConsole.log("Updating version in engine.ts to: " + newVersion.green);
    let engineContent = fs.readFileSync(enginePath).toString();
    let replaced = engineContent.replace(/(public static get Version\(\): string {\s*return ")(.*)(";\s*})/g, "$1" + newVersion + "$3");
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

/**
 * Get the version from the engine class for Babylon
 */
function getEngineVersion() {
    colorConsole.log("Get version from engine.ts");
    const engineContent = fs.readFileSync(enginePath).toString();

    const versionRegex = new RegExp(`public static get Version\\(\\): string {[\\s\\S]*return "([\\s\\S]*?)";[\\s\\S]*}`, "gm");
    const match = versionRegex.exec(engineContent);
    if (match && match.length) {
        const version = match[1];
        colorConsole.log("Version found: " + version.green);
        colorConsole.emptyLine();
        return version;
    }

    colorConsole.error("Version not found in engine.ts");
    process.exit(1);
}

/**
 * Publish a package to npm.
 */
function publish(version, packageName, publishPath, public) {
    colorConsole.log('    Publishing ' + packageName.blue.bold + " from " + publishPath.cyan);

    let tag = "";
    // check for alpha or beta
    if (version.indexOf('alpha') !== -1 || version.indexOf('beta') !== -1) {
        tag = ' --tag preview';
    }

    //publish the respected package
    var cmd = 'npm publish "' + publishPath + '"' + tag;
    if (public) {
       cmd += " --access public";
    }

    if (doNotPublish) {
        colorConsole.log("    If publishing enabled: " + cmd.yellow);
    }
    else {
        colorConsole.log("    Executing: " + cmd.yellow);
        shelljs.exec(cmd);
    }

    colorConsole.success('    Publishing ' + "OK".green);
}

/**
 * Build the folder with Gulp.
 */
function buildBabylonJSAndDependencies() {
    colorConsole.log("Running gulp compilation");
    let exec = shelljs.exec("gulp typescript-libraries --gulpfile ../Gulp/gulpfile.js");
    if (exec.code) {
        colorConsole.error("Error during compilation, aborting");
        process.exit(1);
    }
}

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
 * Special treatment for legacy viewer.
 */
function processLegacyViewer(module, version) {

    let projectPath = '../../Viewer';
    let buildPath = projectPath + "/build/src/";

    if (module.build.requiredFiles) {
        module.build.requiredFiles.forEach(file => {
            let source = path.join(config.computed.rootFolder, file);
            let destination = path.join(buildPath, path.basename(file));
            colorConsole.log("    Copy required file: ", source.cyan, destination.cyan);
            fs.copySync(source, destination);
        });
    }

    // The viewer needs to be built using tsc on the viewer's main repository
    // build the viewer.
    colorConsole.log("    Executing " + ('tsc -p ' + projectPath).yellow);

    let tscCompile = shelljs.exec('tsc -p ' + projectPath);
    if (tscCompile.code !== 0) {
        throw new Error("tsc compilation failed");
    }

    let packageJson = require(buildPath + '/package.json');

    let files = getFiles(buildPath).map(f => f.replace(buildPath + "/", "")).filter(f => f.indexOf("assets/") === -1);

    packageJson.files = files;
    packageJson.version = version;
    packageJson.module = "index.js";
    packageJson.main = "babylon.viewer.js";
    packageJson.typings = "index.d.ts";

    fs.writeFileSync(buildPath + '/package.json', JSON.stringify(packageJson, null, 4));

    publish(version, "viewer", buildPath);
    colorConsole.emptyLine();
}

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
 * Prepare an es6 Dev folder npm linked for test purpose.
 */
function prepareEs6DevPackages() {
    config.modules.forEach(moduleName => {
        let module = config[moduleName];
        let es6Config = module.build.es6;

        colorConsole.log("Prepare " + "ES6Dev".magenta + " Package: " + moduleName.blue.bold);

        let packagePath = module.computed.packageES6Directory;
        let packageDevPath = module.computed.packageES6DevDirectory;

        colorConsole.log("    Cleanup " + packageDevPath.cyan);
        rmDir(packageDevPath);

        colorConsole.log("    Copy Package folder " + packagePath.cyan + " to " + packageDevPath.cyan);
        fs.copySync(packagePath, packageDevPath);

        colorConsole.emptyLine();
    });
}

const createVersion = function(version) {
    // Prevent to build for test Cases.
    if (!doNotBuild) {
        buildBabylonJSAndDependencies();
    }

    // Publish additional packages from the config.
    processAdditionalPackages(version);

    // Create the packages and publish if needed.
    processLegacyPackages(version);

    // Prepare es6 Dev Folder.
    prepareUMDDevPackages();

    // Do not publish es6 yet.
    doNotPublish = true;
    processEs6Packages(version);

    // Prepare es6 Dev Folder.
    prepareEs6DevPackages();
}

/**
 * Main function driving the publication.
 */
module.exports = function(noBuild, noPublish, askVersion) {
    doNotBuild = noBuild;
    doNotPublish = noPublish;

    if (askVersion) {
        prompt.start();

        prompt.get(['version'], function (err, result) {
            const version = result.version;
            
            // Update the engine version if needed.
            if (!version || !version.length) {
                colorConsole.error("New version required.");
                Process.exit(1);
                return;
            }

            updateEngineVersion(version);
            updateRootPackageVersion(version);
            createVersion(version);

            // Invite user to tag with the new version.
            if (newVersion) {
                colorConsole.log("Done, please tag git with " + version);
            }
        });
    }
    else {
        const version = getEngineVersion();
        createVersion(version);
    }
};