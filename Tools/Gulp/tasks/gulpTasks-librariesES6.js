// Gulp Tools
var gulp = require("gulp");
var path = require("path");
var fs = require("fs-extra");
var shelljs = require("shelljs");

// Gulp Helpers
var rmDir = require("../../NodeHelpers/rmDir");
var processImports = require("../helpers/gulp-processImportsToEs6");

// Import Build Config
var config = require("../../Config/config.js");

/**
 * Clean folders.
 */
var clean = function(settings, cb) {
    rmDir(settings.computed.intermediateES6PackageDirectory);
    rmDir(settings.computed.ES6PackageDirectory);
    cb();
}

/**
 * Copy Sources.
 */
var source = function(settings) {
    return gulp.src(settings.computed.mainDirectory + "/**/*")
        .pipe(gulp.dest(settings.computed.intermediateES6PackageDirectory));
}

/**
 * Copy dependencies.
 */
var dep = function(settings) {
    const copyPaths = []
    // Add tsconfig rules.
    copyPaths.push(path.join(config.computed.rootFolder, "tsconfigRules.json"));

    const tsconfig = require(settings.computed.tsConfigPath);
    for (let pathName in tsconfig.compilerOptions.paths) {
        var paths = tsconfig.compilerOptions.paths[pathName];
        for (let dep of paths) {
            const fullPath = path.resolve(settings.computed.mainDirectory, 
                tsconfig.compilerOptions.baseUrl, 
                dep);
            copyPaths.push(fullPath);
        }
    }

    return gulp.src(copyPaths, { base: config.computed.rootFolder })
        .pipe(gulp.dest(config.computed.intermediateES6Package));
}

/**
 * TSC Build.
 */
var build = function(settings, cb) {
    // Launch TSC.
    const options = {
        cwd: settings.computed.intermediateES6PackageDirectory,
        verbose: true
    };

    let command = `tsc --inlineSources --sourceMap true -t es5 -m esNext --outDir "${settings.computed.ES6PackageDirectory}"`;
    shelljs.exec(command, options, function(code, stdout, stderr) {
        if (stderr) {
            console.log(stderr);
        }
        if (stdout) {
            console.log(stdout);
        }

        if (code !== 0) {
            cb("TSC Failed.")
        }
        else {
            cb();
        }
    });
}

/**
 * Adapt Sources import paths.
 */
var modifySources = function(settings) {
    const tsconfig = require(settings.computed.tsConfigPath);

    var replacements = [];
    for (let pathName in tsconfig.compilerOptions.paths) {
        if (pathName.endsWith("/*")) {
            pathName = pathName.replace("/*", "");
        }

        for (var moduleName of config.modules) {
            var module = config[moduleName];
            if (module.build.umd.packageName === pathName) {
                if (module.build.es6.packageName) {
                    var packageName = pathName;
                    var newPackageName = module.build.es6.packageName;
                    replacements.push({ 
                        packageName,
                        newPackageName
                    });
                    break;
                }
            }
        }
    }

    return gulp.src([settings.computed.intermediateES6PackageDirectory + "/**/*.ts", settings.computed.intermediateES6PackageDirectory + "/**/*.tsx"])
        .pipe(processImports(replacements));
}

/**
 * Adapt TS Config Paths.
 */
var modifyTsConfig = function(settings, cb) {
    const tsconfig = require(settings.computed.tsConfigPath);

    var newPaths = { };
    for (let pathName in tsconfig.compilerOptions.paths) {
        var newPathName = pathName;
        var originalPath = pathName;
        if (pathName.endsWith("/*")) {
            pathName = pathName.replace("/*", "");
        }

        var mapped = false;
        for (var moduleName of config.modules) {
            var module = config[moduleName];
            if (module.build.umd.packageName === pathName) {
                if (module.build.es6.packageName) {
                    newPathName = module.build.es6.packageName + "*";
                    newPaths[newPathName] = [ module.computed.ES6PackageDirectory.replace(/\\/g, "/") ];
                    mapped = true;
                    break;
                }
            }
        }
        if (!mapped) {
            newPaths[newPathName] = tsconfig.compilerOptions.paths[originalPath];
        }
    }

    tsconfig.compilerOptions.paths = newPaths;

    const destTsConfig = path.join(settings.computed.intermediateES6PackageDirectory, "tsconfig.json");
    fs.writeJSONSync(destTsConfig, tsconfig);

    cb();
}

/**
 * Dynamic es 6 module creation.
 */
function buildES6Library(settings) {
    // Creates the required tasks.
    var tasks = [];

    var cleanup = function(cb) { return clean(settings, cb); };
    var copySource = function() { return source(settings); };
    var dependencies = function() { return dep(settings); };
    var adaptSourceImportPaths = function() { return modifySources(settings); };
    var adaptTsConfigImportPaths = function(cb) { return modifyTsConfig(settings, cb); };
    var buildes6 = function(cb) { return build(settings, cb) };

    tasks.push(cleanup, copySource, dependencies, adaptSourceImportPaths, adaptTsConfigImportPaths, buildes6);

    return gulp.series.apply(this, tasks);
}

/**
 * Dynamic es 6 module creation.
 */
config.modules.map(function(module) {
    const settings = config[module];
    gulp.task(module + "-es6", buildES6Library(settings));
});