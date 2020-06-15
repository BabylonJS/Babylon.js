// Gulp Tools
var gulp = require("gulp");
var path = require("path");
var fs = require("fs-extra");
var shelljs = require("shelljs");
var concat = require('gulp-concat');

// Gulp Helpers
var rmDir = require("../../NodeHelpers/rmDir");
var processImports = require("../helpers/gulp-processImportsToEs6");
var processConstants = require("../helpers/gulp-processConstants");
var processLooseDeclarations = require("../helpers/gulp-processLooseDeclarationsEs6");
var uncommentShaders = require('../helpers/gulp-removeShaderComments');
var processShaders = require("../helpers/gulp-processShaders");
var del = require("del");

// Import Build Config
var config = require("../../Config/config.js");

/**
 * Clean Source And Dist folders.
 */
var cleanSourceAndDist = function(settings, cb) {
    rmDir(settings.computed.sourceES6Directory);
    rmDir(settings.computed.distES6Directory);
    cb();
}

/**
 * Clean shader ts files.
 */
var cleanShaders = function(settings) {
    return del(settings.computed.shaderTSGlob, { force: true });
}

/**
 * Create shader ts files.
 */
var buildShaders = function(settings) {
    return gulp.src(settings.computed.shaderGlob)
            .pipe(uncommentShaders())
            .pipe(processShaders(settings.isCore));
}

/**
 * Copy Sources.
 */
var source = function(settings) {
    return gulp.src(settings.computed.mainDirectory + "/**/*")
        .pipe(gulp.dest(settings.computed.sourceES6Directory));
}

/**
 * Copy dependencies.
 */
var dep = function(settings) {
    const copyPaths = []
    // Add tsconfig rules.
    copyPaths.push(path.join(config.computed.rootFolder, "/dist/preview release/babylon.max.js"));
    copyPaths.push(path.join(config.computed.rootFolder, "tsconfigRules.json"));

    const tsconfig = require(settings.computed.tsConfigPath);
    for (let pathName in tsconfig.compilerOptions.paths) {
        let paths = tsconfig.compilerOptions.paths[pathName];
        for (let dep of paths) {
            if (dep.indexOf("@babylonjs") === -1) {
                continue;
            }
            const fullPath = path.resolve(settings.computed.mainDirectory, 
                tsconfig.compilerOptions.baseUrl, 
                dep);
            copyPaths.push(fullPath);
        }
    }

    if (settings.build.es6.buildDependencies) {
        for (let pathName of settings.build.es6.buildDependencies) {
            const dependencyPath = path.join(config.computed.rootFolder, pathName);
            copyPaths.push(dependencyPath);
        }
    }

    return gulp.src(copyPaths, { base: config.computed.rootFolder })
        .pipe(gulp.dest(config.computed.sourceES6Folder));
}

/**
 * Adapt Sources import paths.
 */
var modifySourcesImports = function(settings) {
    const tsconfig = require(settings.computed.tsConfigPath);

    var replacements = [];
    for (let pathName in tsconfig.compilerOptions.paths) {
        if (pathName.endsWith("/*")) {
            pathName = pathName.replace("/*", "");
        }

        for (var moduleName of config.es6modules) {
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

    return gulp.src([settings.computed.sourceES6Directory + "/**/*.ts", 
        settings.computed.sourceES6Directory + "/**/*.tsx"])
        .pipe(processImports(replacements));
}

/**
 * Inline Constants in sources.
 */
var modifySourcesConstants = function(settings) {
    if (settings.isCore) {
        return gulp.src([settings.computed.sourceES6Directory + "/**/*.ts", 
            settings.computed.sourceES6Directory + "/**/*.tsx"])
            .pipe(processConstants());
    }
    return Promise.resolve();
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
        for (var moduleName of config.es6modules) {
            var module = config[moduleName];
            if (module.build.umd.packageName === pathName) {
                if (module.build.es6.packageName) {
                    newPathName = module.build.es6.packageName + "*";
                    newPaths[newPathName] = [ module.computed.distES6Directory.replace(/\\/g, "/") ];
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

    const destTsConfig = path.join(settings.computed.sourceES6Directory, "tsconfig.json");
    fs.writeJSONSync(destTsConfig, tsconfig);

    cb();
}

/**
 * Concat Lose DTS Files allowing isolated Modules build
 */
var concatLoseDTSFiles = function(settings) {
    if (settings.build.loseDTSFiles) {
        return gulp.src([path.join(settings.computed.srcDirectory, settings.build.loseDTSFiles.glob)])
            .pipe(concat(config.computed.tempTypingsFileName))
            .pipe(processLooseDeclarations())
            .pipe(gulp.dest(config.computed.tempFolder));
    }
    return Promise.resolve();
}

/**
 * Append Lose DTS Files allowing isolated Modules build
 */
var appendLoseDTSFiles = function(settings) {
    if (settings.build.loseDTSFiles) {
        const mainDeclarationFile = path.join(settings.computed.distES6Directory, settings.build.loseDTSFiles.destFileES6 || "index.d.ts");
        return gulp.src([mainDeclarationFile, config.computed.tempTypingsFilePath])
            .pipe(concat(settings.build.loseDTSFiles.destFileES6))
            .pipe(gulp.dest(settings.computed.distES6Directory));
    }
    return Promise.resolve();
}

/**
 * TSC Build.
 */
var build = function(settings, cb) {
    // Launch TSC.
    const options = {
        cwd: settings.computed.sourceES6Directory,
        verbose: true
    };

    var skipLibCheck = settings.build.es6.skipLibCheck ? 'true' : 'false';
    let command = `node "${config.computed.tscPath}" --skipLibCheck ${skipLibCheck} --inlineSources --sourceMap true -t es5 -m esNext --outDir "${settings.computed.distES6Directory}"`;

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
 * Webpack Build.
 */
var buildWebpack = function(settings, module, cb) {
    const gulpPath = path.join(config.computed.sourceES6Folder, "Tools/Gulp");
    // Launch TSC.
    const options = {
        cwd: gulpPath,
        verbose: true
    };

    let command = `gulp ${module} --noNamespace --moduleName ${settings.build.es6.packageName} --tscPath "${config.computed.tscPath}"`;
    console.log(command)
    shelljs.exec(command, options, function(code, stdout, stderr) {
        if (stderr) {
            console.log(stderr);
        }
        if (stdout) {
            console.log(stdout);
        }

        if (code !== 0) {
            cb("Webpack Build Failed.")
        }
        else {
            cb();
        }
    });
}

/**
 * Copy Webpack Dist.
 */
var copyWebpackDist = function(settings, module) {
    var es6Config = require(path.join(config.computed.sourceES6Folder, "Tools/Config/config"));

    return gulp.src(es6Config[module].computed.distDirectory + "/**/*")
        .pipe(gulp.dest(settings.computed.distES6Directory));
}

/**
 * Dynamic es 6 module creation.
 */
function buildES6Library(settings, module) {
    // Creates the required tasks.
    var tasks = [];

    var cleanAndShaderTasks = [ function cleanES6(cb) { return cleanSourceAndDist(settings, cb); } ];
    if (settings.computed.shaderTSGlob) {
        cleanAndShaderTasks.push(function cleanES6Shaders() { return cleanShaders(settings); });
        cleanAndShaderTasks.push(function() { return buildShaders(settings); });
    }
    var copySource = function() { return source(settings); };
    var dependencies = function() { return dep(settings); };
    var adaptSourceImportPaths = function() { return modifySourcesImports(settings); };
    var adaptSourceConstants = function() { return modifySourcesConstants(settings); };
    var adaptTsConfigImportPaths = function(cb) { return modifyTsConfig(settings, cb); };

    // Build with ts or webpack
    var buildSteps = null;
    if (settings.build.es6.webpackBuild) {
        buildSteps = [
            function buildes6(cb) { return buildWebpack(settings, module, cb) },
            function copyDist() { return copyWebpackDist(settings, module) }
        ];
    }
    else {
        buildSteps = [
            function buildes6(cb) { return build(settings, cb) }, 
            function concatLoseDTS() { return concatLoseDTSFiles(settings) },
            function appendLoseDTS() { return appendLoseDTSFiles(settings) }
        ];
    }

    tasks.push(...cleanAndShaderTasks, copySource, dependencies, adaptSourceImportPaths, adaptSourceConstants, adaptTsConfigImportPaths, ...buildSteps);

    return gulp.series.apply(this, tasks);
}

/**
 * Dynamic es 6 module creation.
 */
config.es6modules.map(function(module) {
    const settings = config[module];
    gulp.task(module + "-es6", buildES6Library(settings, module));
});

/**
 * Build all es 6 libs.
 */
gulp.task("typescript-es6", gulp.series(config.es6modules.map((module) => module + "-es6")));
