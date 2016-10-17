var gulp = require("gulp");
var typescript = require("gulp-typescript");
var concat = require("gulp-concat");
var config = require("./config.json");
var packageConfig = require("./package.json");

/*
* Compiles all typescript files and merges in single loader files
*/
gulp.task("build", function () {
    for (var loaderName in config.loaders) {
        var loader = config.loaders[loaderName];

        var result = gulp.src(loader.files.concat(config.defines))
            .pipe(typescript({
                target: "ES5",
                declarationFiles: true,
                experimentalDecorators: false
            }));
        
        result.js
            .pipe(concat(loader.filename))
            .pipe(gulp.dest(loader.output));
    }
});

/*
* Automatically call the "default" task when a TS file changes
*/
gulp.task("watch", function() {
    var files = [];
    for (var loaderName in config.loaders) {
        files = files.concat(config.loaders[loaderName].files);
    }

	gulp.watch(files, ["build"]);
});

gulp.task("default", ["build"], function() {
    // Nothing...
});
