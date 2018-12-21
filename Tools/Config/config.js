const path = require("path");

const config = require("./config.json");
const configFolder = __dirname;

const rootFolder = path.resolve(configFolder, "../../");
const tempFolder = path.resolve(configFolder, config.build.tempDirectory);
const outputFolder = path.resolve(configFolder, config.build.outputDirectory);
const localDevES6 = path.join(tempFolder, config.build.localDevES6FolderName);
const localDevUMD = path.join(tempFolder, config.build.localDevUMDFolderName);
const ES6Package = path.join(tempFolder, config.build.ES6Package);

config.computed = {
    rootFolder,
    tempFolder,
    outputFolder,
    localDevES6,
    localDevUMD,
    ES6Package
}

config.modules.map(function(module) {
    const settings = config[module];

    const mainDirectory = path.resolve(configFolder, settings.build.mainFolder);
    const distFolder = (settings.build.distOutputDirectory !== undefined) ? settings.build.distOutputDirectory : module;
    const distDirectory = path.join(outputFolder, distFolder);
    const localDevES6Directory = path.join(localDevES6, module);
    const localDevUMDDirectory = path.join(localDevUMD, distFolder);
    const ES6PackageDirectory = path.join(ES6Package, module);

    const webpackConfigPath = path.join(mainDirectory, "webpack.config.js");
    const tsConfigPath = path.join(mainDirectory, "tsconfig.json");
    const packageJSONPath = settings.build.packageJSON || path.join(distDirectory, 'package.json');

    const tsConfig = require(tsConfigPath);
    const srcDirectory = path.resolve(mainDirectory, tsConfig.compilerOptions.rootDir);

    for (let library of settings.libraries) {
        const entryPath = path.join(srcDirectory, library.entry);

        library.computed = {
            entryPath
        };
    }

    settings.computed = {
        mainDirectory,
        srcDirectory,
        distDirectory,
        localDevES6Directory,
        localDevUMDDirectory,
        ES6PackageDirectory,
        webpackConfigPath,
        tsConfigPath,
        packageJSONPath
    }
});

module.exports = config;