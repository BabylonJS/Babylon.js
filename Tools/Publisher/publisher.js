// Dependecies.
const prompt = require('prompt');
const shelljs = require('shelljs');
const fs = require('fs-extra');
const path = require('path');

// CMD Arguments Management.
let doNotBuild = false;
let doNotPublish = false;

// Pathe management.
process.env.PATH += (path.delimiter + path.join(__dirname, 'node_modules', '.bin'));

// Global Variables.
const config = require("../gulp/config.json");
const modules = config.modules.concat(config.viewerModules);
const basePath = config.build.outputDirectory;
const tempPath = config.build.tempDirectory + "es6/";

/**
 * Remove a directory.
 */
const rmDir = function (dirPath) {
    try { var files = fs.readdirSync(dirPath); }
    catch (e) { return; }
    if (files.length > 0)
        for (var i = 0; i < files.length; i++) {
            var filePath = dirPath + '/' + files[i];
            if (fs.statSync(filePath).isFile())
                fs.unlinkSync(filePath);
            else
                rmDir(filePath);
        }
    fs.rmdirSync(dirPath);
};

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
    console.log("Updating version in engine.ts to: " + newVersion);
    let engineContent = fs.readFileSync("../../src/Engines/engine.ts").toString();
    let replaced = engineContent.replace(/(public static get Version\(\): string {\s*return ")(.*)(";\s*})/g, "$1" + newVersion + "$3");
    fs.writeFileSync("../../src/Engines/engine.ts", replaced);
}

/**
 * Get the version from the engine class for Babylon
 */
function getEngineVersion() {
    console.log("Get version from engine.ts");
    const engineContent = fs.readFileSync("../../src/Engines/engine.ts").toString();

    const versionRegex = new RegExp(`public static get Version\\(\\): string {[\\s\\S]*return "([\\s\\S]*?)";[\\s\\S]*}`, "gm");
    const match = versionRegex.exec(engineContent);
    if (match && match.length) {
        const version = match[1];
        console.log("Version found: " + version);
        return version;
    }

    console.log("Version not found in engine.ts");
    process.exit(1);
}

/**
 * Publish a package to npm.
 */
function publish(version, packageName, basePath) {
    console.log('Publishing ' + packageName + " from " + basePath);

    let tag = "";
    // check for alpha or beta
    if (version.indexOf('alpha') !== -1 || version.indexOf('beta') !== -1) {
        tag = '--tag preview';
    }

    //publish the respected package
    if (doNotPublish) {
        console.log("If publishing enabled: " + 'npm publish \"' + basePath + "\"" + ' ' + tag);
    }
    else {
        console.log("Executing: " + 'npm publish \"' + basePath + "\"" + ' ' + tag);
        shelljs.exec('npm publish \"' + basePath + "\"" + ' ' + tag);
    }
}

/**
 * Build the folder with Gulp.
 */
function buildBabylonJSAndDependencies() {
    // run gulp typescript-all
    console.log("Running gulp compilation");
    let exec = shelljs.exec("gulp typescript-all --gulpfile ../Gulp/gulpfile.js");
    if (exec.code) {
        console.log("Error during compilation, aborting");
        process.exit(1);
    }
}

/**
 * Process Legacy Packages.
 */
function processLegacyPackages(version) {
    console.log("Process Legacy Packages...");
    modules.forEach(moduleName => {
        let module = config[moduleName];

        if (moduleName === "core") {
            processLegacyCore(version);
        }
        else {
            if (module.build.requiredFiles) {
                module.build.requiredFiles.forEach(file => {
                    console.error("    ", file, basePath + module.build.distOutputDirectory + '/' + path.basename(file));
                    fs.copySync(file, basePath + module.build.distOutputDirectory + '/' + path.basename(file));
                });
            }

            let packageJson = require(basePath + module.build.distOutputDirectory + 'package.json');
            packageJson.version = version;
            if (packageJson.dependencies) {
                Object.keys(packageJson.dependencies).forEach(key => {
                    if (key.indexOf("babylonjs") !== -1) {
                        packageJson.dependencies[key] = version;
                    }
                });
            }
            fs.writeFileSync(basePath + module.build.distOutputDirectory+ 'package.json', JSON.stringify(packageJson, null, 4));

            publish(version, moduleName, basePath + module.build.distOutputDirectory);
        }
    });
}

/**
 * Process ES6 Packages.
 */
function processEs6Packages(version) {
    console.log("Process ES6 Packages...");
    modules.forEach(moduleName => {
        let module = config[moduleName];
        let es6Config = module.build.es6;
        if (!es6Config) {
            return;
        }

        let projectPath = es6Config.tsFolder;
        let buildPath = path.normalize(tempPath + moduleName);
        let legacyPackageJson = require(module.build.packageJSON || basePath + module.build.distOutputDirectory + 'package.json');

        console.log("Cleanup " + buildPath);
        rmDir(buildPath);

        let command = 'tsc -t es6 -m esNext -p ' + projectPath + ' --outDir ' + buildPath;
        console.log("Executing " + command);

        let tscCompile = shelljs.exec(command);
        if (tscCompile.code !== 0) {
            throw new Error("Tsc compilation failed");
        }

        if (module.build.requiredFiles) {
            module.build.requiredFiles.forEach(file => {
                fs.copySync(file, buildPath + '/' + path.basename(file));
            });
        }

        let files = getFiles(buildPath).map(f => f.replace(buildPath + "/", "")).filter(f => f.indexOf("assets/") === -1);

        legacyPackageJson.name = es6Config.packageName;
        legacyPackageJson.version = version;
        legacyPackageJson.main = "index.js";
        legacyPackageJson.module = "index.js";
        legacyPackageJson.esnext = "index.js";
        legacyPackageJson.typings = "index.d.ts";
        legacyPackageJson.files = files;

        ["dependencies", "peerDependencies", "devDependencies"].forEach(key => {
            if (legacyPackageJson[key]) {
                let dependencies = legacyPackageJson[key];
                legacyPackageJson[key] = {};
                Object.keys(dependencies).forEach(packageName => {
                    if (dependencies[packageName].indexOf("babylonjs") !== -1) {
                        legacyPackageJson[key][packageName + "-es6"] = version;
                    } else {
                        legacyPackageJson[key][packageName] = dependencies[packageName];
                    }
                });
            }
        });

        fs.writeFileSync(buildPath + '/package.json', JSON.stringify(legacyPackageJson, null, 4));

        publish(version, es6Config.packageName, buildPath);
    });
}

/**
 * Special treatment for legacy core.
 */
function processLegacyCore(version) {
    let package = {
        "name": "core",
        "path": "/../../"
    };
    let packageJson = require('../../package.json');

    // make a temporary directory
    fs.ensureDirSync(basePath + '/package/');

    let files = [
        {
            path: basePath + "/babylon.d.ts",
            objectName: "babylon.d.ts"
        },
        {
            path: basePath + "/babylon.js",
            objectName: "babylon.js"
        },
        {
            path: basePath + "/babylon.js.map",
            objectName: "babylon.js.map"
        },
        {
            path: basePath + "/babylon.max.js",
            objectName: "babylon.max.js"
        },
        {
            path: basePath + "/babylon.max.js.map",
            objectName: "babylon.max.js.map"
        },
        {
            path: basePath + "/Oimo.js",
            objectName: "Oimo.js"
        },
        {
            path: basePath + package.path + "readme.md",
            objectName: "readme.md"
        }
    ];

    //copy them to the package path
    files.forEach(file => {
        fs.copySync(file.path, basePath + '/package/' + file.objectName);
    });

    // update package.json
    packageJson.version = version;
    console.log("Generating file list");
    let packageFiles = ["package.json"];
    files.forEach(file => {
        if (!file.isDir) {
            packageFiles.push(file.objectName);
        } else {
            //todo is it better to read the content and add it? leave it like that ATM
            packageFiles.push(file.objectName + "/index.js", file.objectName + "/index.d.ts", file.objectName + "/es6.js")
        }
    });
    console.log("Updating package.json");
    packageJson.files = packageFiles;
    packageJson.main = "babylon.js";
    packageJson.typings = "babylon.d.ts";

    fs.writeFileSync(basePath + '/package/' + 'package.json', JSON.stringify(packageJson, null, 4));

    publish(version, package.name, basePath + '/package/');

    // remove package directory
    fs.removeSync(basePath + '/package/');

    // now update the main package.json
    packageJson.files = packageJson.files.map(file => {
        if (file !== 'package.json' && file !== 'readme.md') {
            return 'dist/preview release/' + file;
        } else {
            return file;
        }
    });
    packageJson.main = "dist/preview release/babylon.js";
    packageJson.typings = "dist/preview release/babylon.d.ts";

    fs.writeFileSync('../../package.json', JSON.stringify(packageJson, null, 4));
}

const createVersion = function(version) {
    // Prevent to build for test Cases.
    if (!doNotBuild) {
        buildBabylonJSAndDependencies();
    }

    // Create the packages and publish if needed.
    processLegacyPackages(version);
    processEs6Packages(version);
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
                console.log("New version required.");
                Process.exit(1);
                return;
            }

            updateEngineVersion(version);
            createVersion(version);

            // Invite user to tag with the new version.
            if (newVersion) {
                console.log("Done, please tag git with " + version);
            }
        });
    }
    else {
        const version = getEngineVersion();
        createVersion(version);
    }
};