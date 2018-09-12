let prompt = require('prompt');
let shelljs = require('shelljs');
let fs = require('fs-extra');
let path = require('path');

// This can be changed when we have a new major release.
let minimumDependency = '>=3.2.0-alpha';

process.env.PATH += (path.delimiter + path.join(__dirname, 'node_modules', '.bin'));

let config = require("./config/config.json");
let basePath = config.basePath;
let packages = config.packages;

function updateEngineVersion(newVersion) {
    console.log("updating version in babylon.engine.ts");
    let engineContent = fs.readFileSync("../../src/Engine/babylon.engine.ts").toString();
    let replaced = engineContent.replace(/(public static get Version\(\): string {\s*return ")(.*)(";\s*})/g, "$1" + newVersion + "$3");
    fs.writeFileSync("../../src/Engine/babylon.engine.ts", replaced);
}

function runGulp() {
    // run gulp typescript-all
    console.log("Running gulp compilation");
    let exec = shelljs.exec("gulp typescript-all --gulpfile ../Gulp/gulpfile.js");
    if (exec.code) {
        console.log("error during compilation, aborting");
        process.exit(1);
    }
}

var rmDir = function (dirPath) {
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

function processPackages(version) {
    packages.forEach((package) => {
        if (package.name === "core") {
            processCore(package, version);
        } /*else if (package.name === "viewer") {
            processViewer(package, version);
        }*/ else {

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
        // the viewer needs to be built using tsc on the viewer's main repository

        // build the viewer
        console.log("cleanup " + buildPath);
        rmDir(buildPath);
        console.log("executing " + 'tsc -m esNext -p ' + projectPath);

        let tscCompile = shelljs.exec('tsc -m esNext -p ' + projectPath);
        if (tscCompile.code !== 0) {
            throw new Error("tsc compilation failed");
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
    })
}

//check if logged in
console.log("Using npm user:");
let loginCheck = shelljs.exec('npm whoami');
if (loginCheck.code === 0) {
    prompt.start();

    prompt.get(['version'], function (err, result) {
        let version = result.version;
        updateEngineVersion(version);
        if (process.argv.indexOf('--no-build') === -1) {
            runGulp();
        }
        processPackages(version);
        processEs6Packages(version);

        console.log("done, please tag git with " + version);
    });
} else {
    console.log('not logged in.');
}

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
    console.log("generating file list");
    let packageFiles = ["package.json"];
    files.forEach(file => {
        if (!file.isDir) {
            packageFiles.push(file.objectName);
        } else {
            //todo is it better to read the content and add it? leave it like that ATM
            packageFiles.push(file.objectName + "/index.js", file.objectName + "/index.d.ts", file.objectName + "/es6.js")
        }
    });
    console.log("updating package.json");
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

/*function processViewer(package, version) {

    let buildPath = basePath + package.path + "build/src/";
    let projectPath = '../../Viewer';

    if (package.required) {
        package.required.forEach(file => {

            fs.copySync(basePath + file, buildPath + '/' + path.basename(file));
        });
    }
    // the viewer needs to be built using tsc on the viewer's main repository

    // build the viewer
    console.log("executing " + 'tsc -p ' + projectPath);

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

    publish(version, package.name, buildPath);

}*/

function publish(version, packageName, basePath) {
    console.log('Publishing ' + packageName + " from " + basePath);

    let tagDef = "";
    // check for alpha or beta
    if (version.indexOf('alpha') !== -1 || version.indexOf('beta') !== -1) {
        tagDef = '--tag preview';
    }

    //publish the respected package
    console.log("executing " + 'npm publish \"' + basePath + "\"" + ' ' + tagDef);
    if (process.argv.indexOf('--no-publish') === -1) {
        shelljs.exec('npm publish \"' + basePath + "\"" + ' ' + tagDef);
    }

}

function getFiles(dir, files_) {
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
