let prompt = require('prompt');
let shelljs = require('shelljs');
let fs = require('fs');

let basePath = '../../dist/preview release';

// This can be changed when we have a new major release.
let minimumDependency = '>=3.1.0-alpha';

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
    }
];

//check if logged in
let loginCheck = shelljs.exec('npm whoami');

if (loginCheck.code === 0) {
    prompt.start();

    prompt.get(['version'], function (err, result) {
        let version = result.version;
        packages.forEach((package) => {
            let packageJson = require(package.path + 'package.json');
            packageJson.version = version;
            if (packageJson.peerDependencies) packageJson.peerDependencies.babylonjs = minimumDependency;
            fs.writeFileSync(package.path + 'package.json', JSON.stringify(packageJson, null, 4));
            console.log('Publishing ' + package.name + " from " + package.path);
            //publish the respected package
            shelljs.exec('npm publish \"' + package.path + "\"");
        });
    });
} else {
    console.log('not logged in.');
}

