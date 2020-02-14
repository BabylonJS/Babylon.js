// Gulp Tools
var fs = require("fs");
var path = require("path");
var through = require('through2');
var PluginError = require('plugin-error');
var colorConsole = require("../../NodeHelpers/colorConsole");

var config = require("../../Config/config");

const indexExlclusion = ["States", "EmitterTypes"];
const forbiddenImports = ["meshBuilder"];

const mapping = {};
config.modules.forEach(moduleName => {
    mapping[config[moduleName].build.umd.packageName] = moduleName;
});

var validatePath = function(fileLocation, directory, module, lineNumber, errors, isExport) {
    let expressionType = isExport ? "Export" : "Import";

    //Not checking svg files
    if(module.endsWith(".svg")){
        return;
    }

    let internalModulePath = path.join(directory, module + ".ts");

    // Check .ts path.
    if (!fs.existsSync(internalModulePath)) {
        internalModulePath = path.join(directory, module + ".tsx");
        // Check .tsx path.
        if (!fs.existsSync(internalModulePath)) {
            // If not found, check index.ts for legacy and index files.
            if (fileLocation.indexOf("legacy") > -1 || fileLocation.indexOf("index") > -1) {
                internalModulePath = path.join(directory, module, "index.ts");
                if (!fs.existsSync(internalModulePath)) {
                    errors.push(`Line ${lineNumber} ${expressionType} from folder only allows if index is present. ${module}`);
                }
            }
            else {
                errors.push(`Line ${lineNumber} ${expressionType}s ${module} needs to be full path (not from directory) for tree shaking.`);
            }
        }
    }

    if (internalModulePath.indexOf("index.") > -1) {
        if (fileLocation.indexOf("legacy") === -1) {
            if (isExport) {
                internalModulePath = path.join(directory, module + ".ts");
                // Check .ts path.
                if (!fs.existsSync(internalModulePath)) {
                    errors.push(`Line ${lineNumber} Exports ${module} should be from the full path including index.`);
                }
            }
            else {
                let excluded = false;
                for (let exclusion of indexExlclusion) {
                    if (internalModulePath.indexOf(exclusion) > -1) {
                        excluded = true;
                        break;
                    }
                }
                if (!excluded && fileLocation.indexOf("index.ts") === -1) {
                    errors.push(`Line ${lineNumber} Imports ${module} should not be from index for tree shaking.`);
                }
            }
        }
    }

    if (!isExport) {
        for (let forbiddenImport of forbiddenImports) {
            if (module.endsWith(forbiddenImport)) {
                errors.push(`Line ${lineNumber} ${expressionType}s ${module} is forbidden for tree shaking.`);
            }
        }
    }
}

var validateImports = function(data, fileLocation, options) {
    var str = "" + data;
    var errors = [];

    // Start process by extracting all lines.
    let lines = str.split('\n');

    // Let's go line by line and check if we have special folder replacements
    // Replaces declare module '...'; by declare module 'babylonjs/...'; for instance
    mainSearch:
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

            if (options.uncheckedLintImports) {
                for (let ext of options.uncheckedLintImports) {
                    if (line.indexOf(ext) > -1) {
                        continue mainSearch;
                    }
                }
            }

            // Check if path is correct internal.
            if (externalModule) {
                const splitter = module.indexOf("/");
                if (splitter === -1 && module !== "babylonjs-gltf2interface") {
                    errors.push(`Line ${index + 1} Import ${module} needs to be relative.`);
                }

                const baseModule = module.substring(0, splitter);
                if (mapping[baseModule]) {
                    const configName = mapping[baseModule];
                    const directory = config[configName].computed.srcDirectory;
                    module = module.substring(splitter);
                    validatePath(fileLocation, directory, module, index + 1, errors, false);
                }
            }
            else {
                // Check Relative.
                if (!module.startsWith(".")) {
                    errors.push(`Line ${index + 1} Import ${module} needs to be relative.`);
                }
                else {
                    const directory = path.dirname(fileLocation);
                    validatePath(fileLocation, directory, module, index + 1, errors, false);
                }
            }
        }

        // Find Exports.
        if (options.isCore && line.indexOf("export") > -1) {
            let regexTypeExport = new RegExp(`export .* from ['"](.*)['"];`, "g");
            let match = regexTypeExport.exec(line);
            if (match) {
                module = match[1];

                // Checks if line is about external module
                if (options.externals) {
                    for (let ext in options.externals) {
                        if (line.indexOf(ext) > -1) {
                            externalModule = ext;
                            break;
                        }
                    }
                }

                // Check if path is correct internal.
                if (externalModule) {
                    const splitter = module.indexOf("/");
                    const baseModule = module.substring(0, splitter);
                    if (mapping[baseModule]) {
                        const configName = mapping[baseModule];

                        const directory = config[configName].computed.srcDirectory;
                        module = module.substring(splitter);
                        validatePath(fileLocation, directory, module, index + 1, errors, true);
                    }
                }
                else {
                    // Check Relative.
                    if (!module.startsWith(".")) {
                        errors.push(`Line ${index + 1} Export ${module} needs to be relative.`);
                    }
                    else {
                        const directory = path.dirname(fileLocation);
                        validatePath(fileLocation, directory, module, index + 1, errors, true);
                    }
                }
            }
        }
    }

    return errors;
}

function gulpValidateImports(options) {
    var globalErrors = [];

    return through.obj(function(file, enc, cb) {
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