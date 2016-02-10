var gulp = require("gulp");
var webserver = require('gulp-webserver');

gulp.task('copyReference', function () {
    return gulp.src(["..../../../dist/preview release/babylon.max.js", 
        "../../../dist/babylon.pbrMaterial.js"]).pipe(gulp.dest("refs"));
});

/**
 * Web server task to serve a local test page
 */
gulp.task('default', ['copyReference'], function() {
  gulp.src('.')
    .pipe(webserver({
      livereload: false,
      open: 'http://localhost:1339/index.html',
      port: 1339,
      fallback: 'index.html'
    }));
});

