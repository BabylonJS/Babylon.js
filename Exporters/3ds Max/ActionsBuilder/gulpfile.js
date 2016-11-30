var gulp = require('gulp');
var ts = require('gulp-typescript');

var files = [
    // Files
    // Equivalent to "./*.ts",
    "actionsbuilder.actionNode.ts",
    "actionsbuilder.contextMenu.ts",
	"actionsbuilder.list.ts",
    "actionsbuilder.main.ts",
    "actionsbuilder.parameters.ts",
    "actionsbuilder.toolbar.ts",
    "actionsbuilder.ts",
    "actionsbuilder.utils.ts",
    "actionsbuilder.viewer.ts",
    // References
    "raphaeljs.d.ts",
    "../../dist/*.d.ts",
    "../..external references/**/*.d.ts"
];

gulp.task("default", function () {
    var result = gulp.src(files)
		.pipe(ts({
            target: "ES5",
		    out: "actionsbuilder.max.js" // Merge
		}));
    return result.js.pipe(gulp.dest("./Sources/"));
});

gulp.task("debug", function () {
    var result = gulp.src(files)
		.pipe(ts({
		    target: "ES5",
            outDir: "./Sources/"
		}));
    return result.js.pipe(gulp.dest("./Sources/"));
});

gulp.task("watch", function () {
    gulp.watch(files, ["default"]);
});
