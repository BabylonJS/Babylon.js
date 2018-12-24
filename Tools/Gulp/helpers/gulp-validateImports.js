// Gulp Tools
var fs = require("fs");
var path = require("path");
var through = require('through2');
var PluginError = require('plugin-error');
var colorConsole = require("../../NodeHelpers/colorConsole");

var config = require("../../Config/config");

const indexExlclusion = ["States", "EmitterTypes"];

var validateImports = function(data, fileLocation, options) {
    var str = "" + data;
    var errors = [];

    // Start process by extracting all lines.
    let lines = str.split('\n');

    // Let's go line by line and check if we have special folder replacements
    // Replaces declare module '...'; by declare module 'babylonjs/...'; for instance
    for (let index = 0; index < lines.length; index++) {
        let line = lines[index];
        let module = null, externalModule = null;

        // Find Imports.
        if (line.indexOf("import") > -1) {
            let regexTypeImport = new RegExp(`import .* from ['"](.*)['"];`, "g");
            let match = regexTypeImport.exec(line);
            if (match) {
                module = match[1];
            }
            else {
                let regexSideEffectImport = new RegExp(`import \\(*['"](.*)['"]\\)*;`, "g");
                let matchSideEffects = regexSideEffectImport.exec(line);
                if (matchSideEffects) {
                    module = matchSideEffects[1];
                }
                else {
                    continue;
                }
            }

            // Checks if line is about external module
            if (options.externals) {
                for (let ext in options.externals) {
                    if (line.indexOf(ext) > -1) {
                        externalModule = ext;
                        break;
                    }
                }
            }

            // Check Relative.
            if (!externalModule && !module.startsWith(".")) {
                errors.push(`Line ${index} Imports needs to be relative. ${module}`);
            }

            // Check if path is correct internal.
            if (!externalModule) {
                const directory = path.dirname(fileLocation);
                let internalModulePath = path.join(directory, module + ".ts");
                if (!fs.existsSync(internalModulePath)) {
                    let internalModulePath = path.join(directory, module + ".tsx");
                    if (!fs.existsSync(internalModulePath)) {
                        if (fileLocation.indexOf("legacy") > -1 || fileLocation.indexOf("index") > -1) {
                            let internalModulePath = path.join(directory, module + "index.ts");
                            if (!fs.existsSync(internalModulePath)) {
                                let internalModulePath = path.join(directory, module + "/index.ts");
                                if (!fs.existsSync(internalModulePath)) {
                                    errors.push(`Line ${index} Imports needs to be full path. ${module}`);
                                }
                            }
                        }
                        else {
                            errors.push(`Line ${index} Imports ${module} needs to be full path.`);
                        }
                    }
                }

                if (internalModulePath.indexOf("index.") > -1) {
                    if (fileLocation.indexOf("legacy") === -1) {
                        let excluded = false;
                        for (let exclusion of indexExlclusion) {
                            if (internalModulePath.indexOf(exclusion) > -1) {
                                excluded = true;
                                break;
                            }
                        }
                        if (!excluded) {
                            errors.push(`Line ${index} Imports ${module} should not be from index for tree shaking.`);
                        }
                    }
                }
            }
            else {
                const mapping = {
                    "babylonjs": "core",
                    "babylonjs-loaders": "loaders",
                    "babylonjs-serializers": "serializers",
                    "babylonjs-gui": "gui",
                };

                const splitter = module.indexOf("/");
                const baseModule = module.substring(0, splitter);
                if (mapping[baseModule]) {
                    const configName = mapping[baseModule];

                    const directory = config[configName].computed.srcDirectory;
                    module = module.substring(splitter);

                    let internalModulePath = path.join(directory, module + ".ts");
                    if (!fs.existsSync(internalModulePath)) {
                        let internalModulePath = path.join(directory, module + ".tsx");
                        if (!fs.existsSync(internalModulePath)) {
                            if (fileLocation.indexOf("legacy") > -1 || fileLocation.indexOf("index") > -1) {
                                let internalModulePath = path.join(directory, module + "index.ts");
                                if (!fs.existsSync(internalModulePath)) {
                                    let internalModulePath = path.join(directory, module + "/index.ts");
                                    if (!fs.existsSync(internalModulePath)) {
                                        errors.push(`Line ${index} Imports needs to be full path. ${module}`);
                                    }
                                }
                            }
                            else {
                                errors.push(`Line ${index} Imports ${module} needs to be full path.`);
                            }
                        }
                    }

                    if (internalModulePath.indexOf("index.") > -1) {
                        if (fileLocation.indexOf("legacy") === -1) {
                            let excluded = false;
                            for (let exclusion of indexExlclusion) {
                                if (internalModulePath.indexOf(exclusion) > -1) {
                                    excluded = true;
                                    break;
                                }
                            }
                            if (!excluded) {
                                errors.push(`Line ${index} Imports ${module} should not be from index for tree shaking.`);
                            }
                        }
                    }
                }
            }
        }
    }

    return errors;
}

function gulpValidateImports(options) {
    var globalErrors = [];

    return through.obj(function (file, enc, cb) {
        if (file.isNull()) {
            cb(null, file);
            return;
        }
        if (file.isStream()) {
            cb(new PluginError("Validate imports", "Streaming not supported."));
        }
        
        let data = file.contents.toString();
        let result = validateImports(data, file.path, options);

        if (result.length > 0) {
            for (let error of result) {
                globalErrors.push({
                    message: error,
                    path: file.path
                });
            }
        }

        return cb();
    }, 
    function endStream(cb) {
        if (globalErrors.length > 0) {
            for (let error of globalErrors) {
                colorConsole.error(error.message + " " + error.path);
            }
            colorConsole.error(`Import validation failed with ${globalErrors.length} errors.`);

            var finalMessage = new PluginError('gulp-validateImports', `gulp-validateImports: ${globalErrors.length} errors found.`);
            this.emit('error', finalMessage);
        }

        cb();
    });
}

module.exports = gulpValidateImports;