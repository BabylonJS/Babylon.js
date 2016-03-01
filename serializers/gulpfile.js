var gulp = require("gulp");
var uglify = require("gulp-uglify");
var typescript = require("gulp-typescript");
var sourcemaps = require("gulp-sourcemaps");
var merge2 = require("merge2");
var concat = require("gulp-concat");
var rename = require("gulp-rename");
var cleants = require('gulp-clean-ts-extends');
var changed = require('gulp-changed');
var runSequence = require('run-sequence');
var replace = require("gulp-replace")

var config = require("./config.json");

/*
Compiles all typescript files and creating a declaration file.
*/
gulp.task('default', function() {  
    var tsResult = gulp.src(["**/*.ts", "!**/*.d.ts"])
                .pipe(typescript({ 
                    noExternalResolve: false, 
                    target: 'ES5', 
                    declarationFiles: true,
                    typescript: require('typescript')
                })).on('error', function(error) {
                    console.log('Typescript compile failed');
                    process.exit(1);
                });
                
   return tsResult.js.pipe(gulp.dest("."));
});

/**
 * Watch task, will call the default task if a js file is updated.
 */
gulp.task('watch', function() {
  gulp.watch(config.core.typescript, ['default']);
});
