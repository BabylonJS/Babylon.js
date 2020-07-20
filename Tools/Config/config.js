const path = require("path");
const fs = require("fs-extra");

const config = require("./config.json");
const configFolder = __dirname;

const rootFolder = path.resolve(configFolder, "../../");
const tempFolder = path.resolve(rootFolder, config.build.tempDirectory);
const outputFolder = path.resolve(configFolder, config.build.outputDirectory);
const localDevES6Folder = path.join(tempFolder, config.build.localDevES6FolderName);
const localDevUMDFolder = path.join(tempFolder, config.build.localDevUMDFolderName);
const packageUMDFolder = path.join(tempFolder, config.build.packageUMDFolderName);
const packageUMDDevFolder = path.join(tempFolder, config.build.packageUMDDevFolderName);
const sourceES6Folder = path.join(tempFolder, config.build.sourceES6FolderName);
const distES6Folder = path.join(tempFolder, config.build.distES6FolderName);
const packageES6Folder = path.join(tempFolder, config.build.packageES6FolderName);
const packageES6DevFolder = path.join(tempFolder, config.build.packageES6DevFolderName);

const tempTypingsAMDFileName = config.build.tempTypingsAMDFileName;
const tempTypingsFileName = tempTypingsAMDFileName.replace(".js", ".d.ts");
const tempTypingsAMDFilePath = path.join(tempFolder, tempTypingsAMDFileName);
const tempTypingsFilePath = path.join(tempFolder, tempTypingsFileName);

const tscPath = path.resolve(rootFolder, "node_modules/typescript/bin/tsc");

config.computed = {
    rootFolder,
    tempFolder,
    outputFolder,
    localDevES6Folder,
    localDevUMDFolder,
    packageUMDFolder,
    packageUMDDevFolder,
    sourceES6Folder,
    distES6Folder,
    packageES6Folder,
    packageES6DevFolder,
    tempTypingsAMDFileName,
    tempTypingsFileName,
    tempTypingsAMDFilePath,
    tempTypingsFilePath,
    tscPath
}

config.additionalNpmPackages.forEach(package => {
    let packagePath = path.join(rootFolder, package.path);
    let packageDevDirectory = path.join(localDevUMDFolder, package.name);

    package.computed = {
        path: packagePath,
        packageDevDirectory
    };
});

const allModules = [];
config.modules.map(function(module) {
    if (allModules.indexOf(module) === -1) {
        allModules.push(module);
    }
});
config.es6modules.map(function(module) {
    if (allModules.indexOf(module) === -1) {
        allModules.push(module);
    }
});
config.apps.map(function(module) {
    if (allModules.indexOf(module) === -1) {
        allModules.push(module);
    }
});

allModules.map(function(module) {
    const settings = config[module];

    const mainDirectory = path.resolve(rootFolder, settings.build.mainFolder);
    const distFolder = (settings.build.distOutputDirectory !== undefined) ? settings.build.distOutputDirectory : module;
    const distDirectory = path.join(outputFolder, distFolder);
    const localDevES6Directory = path.join(localDevES6Folder, module);
    const localDevUMDDirectory = path.join(localDevUMDFolder, distFolder);
    const packageUMDDirectory = path.join(packageUMDFolder, module);
    const packageUMDDevDirectory = path.join(packageUMDDevFolder, module);
    const sourceES6Directory = path.join(sourceES6Folder, module);
    const distES6Directory = path.join(distES6Folder, module);
    const packageES6Directory = path.join(packageES6Folder, module);
    const packageES6DevDirectory = path.join(packageES6DevFolder, module);

    const webpackConfigPath = path.join(mainDirectory, "webpack.config.js");
    const tsConfigPath = path.join(mainDirectory, "tsconfig.json");
    const packageJSONPath = settings.build.packageJSON ? 
        path.join(rootFolder, settings.build.packageJSON) : 
        path.join(distDirectory, 'package.json');

    settings.computed = {
        mainDirectory,
        distDirectory,
        localDevES6Directory,
        localDevUMDDirectory,
        packageUMDDirectory,
        packageUMDDevDirectory,
        sourceES6Directory,
        distES6Directory,
        packageES6Directory,
        packageES6DevDirectory,
        webpackConfigPath,
        tsConfigPath,
        packageJSONPath
    }

    // Prevent es6 bundled lib crash.
    if (fs.existsSync(tsConfigPath)) {
        const tsConfig = require(tsConfigPath);
        const srcDirectory = path.resolve(mainDirectory, tsConfig.compilerOptions.rootDir);

        const shaderGlob = srcDirectory.replace(/\\/g, "/") + "/**/*.fx";
        const shaderTSGlob = [
            srcDirectory.replace(/\\/g, "/") + "/**/*.fragment.ts",
            srcDirectory.replace(/\\/g, "/") + "/**/*.vertex.ts",
            srcDirectory.replace(/\\/g, "/") + "/**/ShadersInclude/*.ts",
        ];
        const tsGlob = srcDirectory.replace(/\\/g, "/") + "/**/*.ts*";

        if (settings.libraries) {
            for (let library of settings.libraries) {
                if(library.entry){
                    const entryPath = path.join(srcDirectory, library.entry);

                    library.computed = {
                        entryPath
                    };
                }
            }
        }

        settings.computed.srcDirectory = srcDirectory;
        settings.computed.shaderGlob = shaderGlob;
        settings.computed.shaderTSGlob = shaderTSGlob;
        settings.computed.tsGlob = tsGlob;
    }
});

module.exports = config;