// Import Dependencies.
var gulp = require("gulp");
let shelljs = require('shelljs');
var del = require("del");

// Import Helpers.
var processShaders = require("../helpers/gulp-processShaders");
var uncommentShaders = require('../helpers/gulp-removeShaderComments');
var rmDir = require('../helpers/gulp-rmDir');

// Read the full config.
var config = require("../config.json");

/**
 * Clean shader ts files.
 */
var cleanShaders = function(settings) {
    return del([settings.srcDirectory + "**/*.fx.ts"]);
}

/**
 * Watch ts files and fire repective tasks.
 */
gulp.task("watchCore", async function startWatch() {
    var module = "core";
    var settings = config[module].build;
    var library = config[module].libraries[0];

    // Clean shaders.
    await cleanShaders(settings);

    // Generate shaders.
    gulp.src(settings.srcDirectory + "**/*.fx")
        .pipe(uncommentShaders())
        .pipe(processShaders(true))

    // Clean Folder.
    rmDir('../../.temp/LocalDevES6/core');

    // Launch TSC.
    const options = {
        cwd: "../../src/",
        async: true,
        verbose: true
    };
    shelljs.exec("tsc --isolatedModules true --declaration false --target es5 --module es2015 --outDir ../.temp/es6LocalDev/core -w", options, function(code, stdout, stderr) {
        if (stderr) {
            console.log(stderr);
        }
        if (stdout) {
            console.log(stdout);
        }
    });

    // Launch shader watch    
    gulp.watch(settings.srcDirectory + "**/*.fx", { interval: 1000 }, function() {
        console.log(library.output + ": Shaders.");
        return gulp.src(settings.srcDirectory + "**/*.fx")
            .pipe(uncommentShaders())
            .pipe(processShaders(true));
    });
});