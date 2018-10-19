// Dependecies.
const prompt = require('prompt');
const shelljs = require('shelljs');
const fs = require('fs-extra');
const path = require('path');

// This can be changed when we have a new major release.
const minimumDependency = '>=3.4.0-alpha';

// CMD Arguments Management.
let doNotBuild = false;
let doNotPublish = false;

// Pathe management.
process.env.PATH += (path.delimiter + path.join(__dirname, 'node_modules', '.bin'));

// Global Variables.
const config = require("./config/config.json");
const basePath = config.basePath;
const packages = config.packages;

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
    console.log("Updating version in babylon.engine.ts to: " + newVersion);
    let engineContent = fs.readFileSync("../../src/Engine/babylon.engine.ts").toString();
    let replaced = engineContent.replace(/(public static get Version\(\): string {\s*return ")(.*)(";\s*})/g, "$1" + newVersion + "$3");
    fs.writeFileSync("../../src/Engine/babylon.engine.ts", replaced);
}

/**
 * Get the version from the engine class for Babylon
 */
function getEngineVersion() {
    console.log("Get version from babylon.engine.ts");
    const engineContent = fs.readFileSync("../../src/Engine/babylon.engine.ts").toString();

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
    packages.forEach((package) => {
        if (package.name === "core") {
            processCore(package, version);
        }
        else {
            if (package.required) {
                package.required.forEach(file => {
                    fs.copySync(basePath + file, basePath + package.path + '/' + path.basename(file));
                });
            }

            let packageJson = require(basePath + package.path + 'package.json');
            packageJson.version = version;
            if (packageJson.dependencies) {
                Object.keys(packageJson.dependencies).forEach(key => {
                    if (key.indexOf("babylonjs") !== -1) {
                        packageJson.dependencies[key] = version;
                    }
                });
            }
            if (packageJson.peerDependencies) packageJson.peerDependencies.babylonjs = minimumDependency;
            fs.writeFileSync(basePath + package.path + 'package.json', JSON.stringify(packageJson, null, 4));

            publish(version, package.name, basePath + package.path);
        }
    });
}

/**
 * Process ES6 Packages.
 */
function processEs6Packages(version) {
    let es6Packages = config.es6;

    es6Packages.forEach(package => {
        let projectPath = package.path;
        let buildPath = path.normalize(basePath + projectPath + package.buildPath);

        if (package.required) {
            package.required.forEach(file => {
                fs.copySync(file, basePath + '/' + path.basename(file));
            });
        }

        console.log("Cleanup " + buildPath);
        rmDir(buildPath);

        console.log("Executing " + 'tsc -t es6 -m esNext -p ' + projectPath);

        let tscCompile = shelljs.exec('tsc -t es6 -m esNext -p ' + projectPath);
        if (tscCompile.code !== 0) {
            throw new Error("Tsc compilation failed");
        }

        let packageJson = require("./config" + '/template.package.json');
        let files = getFiles(buildPath).map(f => f.replace(buildPath + "/", "")).filter(f => f.indexOf("assets/") === -1);

        packageJson.files = files;
        packageJson.version = version;

        Object.keys(package.payload).forEach(key => {
            packageJson[key] = package.payload[key]
        });

        ["dependencies", "peerDependencies", "devDependencies"].forEach(key => {
            if (package.payload[key]) {
                packageJson[key] = {};
                Object.keys(package.payload[key]).forEach(packageName => {
                    if (package.payload[key][packageName] === true) {
                        packageJson[key][packageName] = version;
                    } else {
                        packageJson[key][packageName] = package.payload[key][packageName];
                    }
                });
            }
        });

        fs.writeFileSync(buildPath + '/package.json', JSON.stringify(packageJson, null, 4));

        publish(version, package.name, buildPath);
    });
}

/**
 * Special treatment for core.
 */
function processCore(package, version) {
    let packageJson = require(package.path + 'package.json');

    // make a temporary directory
    fs.ensureDirSync(basePath + 'package/');

    let files = [
        {
            path: basePath + "babylon.d.ts",
            objectName: "babylon.d.ts"
        },
        {
            path: basePath + "es6.js",
            objectName: "es6.js"
        },
        {
            path: basePath + "babylon.js",
            objectName: "babylon.js"
        },
        {
            path: basePath + "babylon.max.js",
            objectName: "babylon.max.js"
        },
        {
            path: basePath + "babylon.worker.js",
            objectName: "babylon.worker.js"
        },
        {
            path: basePath + "Oimo.js",
            objectName: "Oimo.js"
        },
        {
            path: basePath + package.path + "readme.md",
            objectName: "readme.md"
        }
    ];

    //copy them to the package path
    files.forEach(file => {
        fs.copySync(file.path, basePath + 'package/' + file.objectName);
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

    fs.writeFileSync(basePath + 'package/' + 'package.json', JSON.stringify(packageJson, null, 4));

    publish(version, package.name, basePath + 'package/');

    // remove package directory
    fs.removeSync(basePath + 'package/');

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

    fs.writeFileSync(package.path + 'package.json', JSON.stringify(packageJson, null, 4));
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