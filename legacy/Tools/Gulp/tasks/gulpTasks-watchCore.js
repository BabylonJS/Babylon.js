// Import Dependencies.
var gulp = require("gulp");
let shelljs = require('shelljs');
var del = require("del");

// Import Helpers.
var processShaders = require("../helpers/gulp-processShaders");
var uncommentShaders = require('../helpers/gulp-removeShaderComments');
var rmDir = require("../../NodeHelpers/rmDir");

// Read the full config.
var config = require("../../Config/config.js");

// Constants
var module = "core";

/**
 * Process shader ts files.
 */
gulp.task("watchCore-cleanShaders", function startWatch() {
    var settings = config[module].computed;

    // Clean shaders.
    return del(settings.shaderTSGlob, { force: true });
});

gulp.task("watchCore-buildShaders", gulp.series("watchCore-cleanShaders", function buildShaders() {
    var settings = config[module].computed;
    uncommentShaders.displayName = "Uncomment";
    processShaders.displayName = "Process";

    // Generate shaders.
    return gulp.src(settings.shaderGlob)
        .pipe(uncommentShaders())
        .pipe(processShaders(true));
}));

/**
 * Watch ts files and fire repective tasks.
 */
gulp.task("watchCore", gulp.series("watchCore-buildShaders", function watch() {
    var settings = config[module].computed;
    var library = config[module].libraries[0];

    // Generate output path.
    var outputDirectory = settings.localDevES6Directory;

    // Clean Folder.
    rmDir(outputDirectory);

    // Launch TSC.
    const options = {
        cwd: settings.srcDirectory,
        async: true,
        verbose: true
    };
    shelljs.exec(`node "${config.computed.tscPath}" --importHelpers false --isolatedModules true --declaration false --target es5 --module es2015 --outDir "${outputDirectory}" -w`, options, function(code, stdout, stderr) {
        if (stderr) {
            console.log(stderr);
        }
        if (stdout) {
            console.log(stdout);
        }
    });

    // Launch shader watch.
    var watch = gulp.watch(settings.shaderGlob, { interval: 1000 }, function() {
        console.log(library.output + ": Shaders.");
    })
    watch.on("add", (event) => {
        return gulp.src(event)
            .pipe(uncommentShaders())
            .pipe(processShaders(true));
    });
    watch.on("change", (event) => {
        return gulp.src(event)
            .pipe(uncommentShaders())
            .pipe(processShaders(true));
    });

    return Promise.resolve();
}));