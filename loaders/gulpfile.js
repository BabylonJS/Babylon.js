var gulp = require("gulp");
var uglify = require("gulp-uglify");
var typescript = require("gulp-typescript");
var config = require("./config.json");
var packageConfig = require("./package.json");

/*
* Compiles all typescript files and merges in singles loader files
*/
gulp.task("build", function () {
    for (var loaderName in config.loaders) {
        var loader = config.loaders[loaderName];

        for (var i=0; i < config.defines.length; i++) {
            loader.files.push(config.defines[i]);
        }

        var result = gulp.src(loader.files.concat(config.defines))
            .pipe(typescript({
                target: "ES5",
                declarationFiles: true,
                experimentalDecorators: false,
                out: loader.output
            }));
    }
});

/*
* Automatically call the "default" task when a TS file changes
*/
gulp.task("watch", function() {
    var files = [];
    for (var loaderName in config.loaders) {
        var loader = config.loaders[loaderName];
        
        // For each file
        for (var i=0; i < loader.files.length; i++) {
            files.push(loader.files[i]);
        }
    }

	gulp.watch(files, ["build"]);
});

gulp.task("default", ["build"], function() {
    // Nothing...
});
