let prompt = require('prompt');
let shelljs = require('shelljs');
let fs = require('fs-extra');

let basePath = '../../dist/preview release';

// This can be changed when we have a new major release.
let minimumDependency = '>=3.2.0-alpha';

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
        path: basePath + '/viewer/'
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
    let exec = shelljs.exec("gulp typescript-all --gulpfile ../Gulp/gulpfile.js");
    if (exec.code) {
        console.log("error during compilation, aborting");
        process.exit(1);
    }
}

function processPackages() {
    packages.forEach((package) => {
        if (package.name === "core") {
            processCore(package, version);
        } else {
            let packageJson = require(package.path + 'package.json');
            packageJson.version = version;
            if (packageJson.peerDependencies) packageJson.peerDependencies.babylonjs = minimumDependency;
            fs.writeFileSync(package.path + 'package.json', JSON.stringify(packageJson, null, 4));
            console.log('Publishing ' + package.name + " from " + package.path);
            //publish the respected package
            shelljs.exec('npm publish \"' + package.path + "\"");
        }

    });
}

//check if logged in
console.log("Using npm user:");
let loginCheck = shelljs.exec('npm whoami');
console.log("Not that I can check, but - did you run gulp typescript-all?");
if (loginCheck.code === 0) {
    prompt.start();

    prompt.get(['version'], function (err, result) {
        let version = result.version;
        updateEngineVersion(version);
        runGulp();
        processPackages();

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

    // remove the modules for now
    /*fs.readdirSync(basePath + '/modules/').forEach(object => {
        console.log(object);
        if (fs.statSync(basePath + '/modules/' + object).isDirectory) {
            files.push({
                path: basePath + '/modules/' + object,
                objectName: object,
                isDir: true
            });
        }
    })*/

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
    packageJson.main = "babylon.max.js";
    packageJson.typings = "babylon.d.ts";

    fs.writeFileSync(basePath + '/package/' + 'package.json', JSON.stringify(packageJson, null, 4));

    console.log('Publishing ' + package.name + " from " + basePath + '/package/');
    //publish the respected package
    shelljs.exec('npm publish \"' + basePath + '/package/' + "\"");

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
    packageJson.main = "dist/preview release/babylon.max.js";
    packageJson.typings = "dist/preview release/babylon.d.ts";

    fs.writeFileSync(package.path + 'package.json', JSON.stringify(packageJson, null, 4));
}

