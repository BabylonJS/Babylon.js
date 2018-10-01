let prompt = require('prompt');
let shelljs = require('shelljs');
let fs = require('fs-extra');
let path = require('path');

let basePath = '../../dist/preview release';

// This can be changed when we have a new major release.
let minimumDependency = '>=3.3.0-rc.4';

process.env.PATH += (path.delimiter + path.join(__dirname, 'node_modules', '.bin'));

let packages = [
    {
        name: 'core',
        path: '../../'
    },
    {
        name: 'gui',
        path: basePath + '/gui/'
    },
    {
        name: 'materials',
        path: basePath + '/materialsLibrary/'
    },
    {
        name: 'postProcess',
        path: basePath + '/postProcessesLibrary/'
    },
    {
        name: 'gltf2interface',
        path: basePath + '/gltf2interface/'
    },
    {
        name: 'loaders',
        path: basePath + '/loaders/'
    },
    {
        name: 'serializers',
        path: basePath + '/serializers/'
    },
    {
        name: 'proceduralTextures',
        path: basePath + '/proceduralTexturesLibrary/'
    },
    {
        name: 'inspector',
        path: basePath + '/inspector/'
    },
    {
        name: 'viewer',
        path: basePath + '/../../Viewer/',
        required: [
            basePath + '/viewer/readme.md',
            basePath + '/viewer/package.json',
            basePath + '/viewer/babylon.viewer.js',
            basePath + '/viewer/babylon.viewer.max.js'
        ]
    },
    {
        name: 'viewer-assets',
        path: basePath + '/../../Viewer/build/assets/',
        required: [
            basePath + '/../../Viewer/assets/readme.md',
            basePath + '/../../Viewer/assets/package.json',
        ]
    }
];

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

function processPackages(version) {
    packages.forEach((package) => {
        if (package.name === "core") {
            processCore(package, version);
        } else if (package.name === "viewer") {
            processViewer(package, version);
        } else {

            if (package.required) {
                package.required.forEach(file => {
                    fs.copySync(file, package.path + '/' + path.basename(file));
                });
            }

            let packageJson = require(package.path + 'package.json');
            packageJson.version = version;
            if (packageJson.dependencies) {
                Object.keys(packageJson.dependencies).forEach(key => {
                    if (key.indexOf("babylonjs") !== -1) {
                        packageJson.dependencies[key] = version;
                    }
                });
            }
            if (packageJson.peerDependencies) packageJson.peerDependencies.babylonjs = minimumDependency;
            fs.writeFileSync(package.path + 'package.json', JSON.stringify(packageJson, null, 4));

            publish(version, package.name, package.path);
        }

    });
}

//check if logged in
console.log("Using npm user:");
let loginCheck = shelljs.exec('npm whoami');
if (loginCheck.code === 0) {
    prompt.start();

    prompt.get(['version'], function(err, result) {
        let version = result.version;
        updateEngineVersion(version);
        if (process.argv.indexOf('--no-build') === -1) {
            runGulp();
        }
        processPackages(version);

        console.log("done, please tag git with " + version);
    });
} else {
    console.log('not logged in.');
}

function processCore(package, version) {
    let packageJson = require(package.path + 'package.json');

    // make a temporary directory
    fs.ensureDirSync(basePath + '/package/');

    let files = [
        {
            path: basePath + "/babylon.d.ts",
            objectName: "babylon.d.ts"
        },
        {
            path: basePath + "/es6.js",
            objectName: "es6.js"
        },
        {
            path: basePath + "/babylon.js",
            objectName: "babylon.js"
        },
        {
            path: basePath + "/babylon.max.js",
            objectName: "babylon.max.js"
        },
        {
            path: basePath + "/babylon.worker.js",
            objectName: "babylon.worker.js"
        },
        {
            path: basePath + "/Oimo.js",
            objectName: "Oimo.js"
        },
        {
            path: package.path + "readme.md",
            objectName: "readme.md"
        }
    ];

    //copy them to the package path
    files.forEach(file => {
        fs.copySync(file.path, basePath + '/package/' + file.objectName);
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

    fs.writeFileSync(package.path + 'package.json', JSON.stringify(packageJson, null, 4));
}

function processViewer(package, version) {

    let buildPath = package.path + "build/src/";
    let projectPath = '../../Viewer';

    if (package.required) {
        package.required.forEach(file => {

            fs.copySync(file, buildPath + '/' + path.basename(file));
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

}

function publish(version, packageName, basePath) {
    console.log('Publishing ' + packageName + " from " + basePath);

    let tagDef = "";
    // check for alpha or beta
    if (version.indexOf('alpha') !== -1 || version.indexOf('beta') !== -1 || version.indexOf('-rc.') !== -1) {
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
