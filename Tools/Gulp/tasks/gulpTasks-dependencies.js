// Import Dependencies.
const gulp = require("gulp");
const path = require("path");
const depcruise = require('dependency-cruiser');
const colorConsole = require('../../NodeHelpers/colorConsole');

// Read the full config.
const config = require("../../Config/config.js");

/*
 * TsLint all typescript files from the src directory.
 */
const dependencies = function(settings, moduleName, cb) {
    var cruiseResult = depcruise.cruise(
        [path.relative(path.resolve("./"), settings.computed.mainDirectory)],
        {
            validate: true,
            ruleSet: {
                forbidden: [{
                    name: 'no-circular',
                    comment: 'circular dependencies will make you dizzy',
                    severity: 'error',
                    from: {},
                    to: {
                        circular: true
                    }
                }],
                options: {
                    doNotFollow: "node_modules",
                    tsConfig: {
                        fileName: settings.computed.tsConfigPath
                    },
                    webpackConfig: {
                        fileName: settings.computed.webpackConfigPath
                    }
                }
            }
        });

    if (cruiseResult.output.summary.error > 0) {
        var errorCount = cruiseResult.output.summary.error;

        if (errorCount > 0) {
            colorConsole.error(`New circular dependencies in ${moduleName.cyan}: ${("" + errorCount).red}`);
            for (let error of cruiseResult.output.summary.violations) {
                colorConsole.error(`    From: '${error.from.replace(/\.\.\//g, "").yellow}' To: '${error.to.replace(/\.\.\//g, "").yellow}'`);
            }
            process.exit(1);
        }
    }

    colorConsole.success("No New circular dependencies.");
    cb();
}

/**
 * Dynamic module linting for external library (mat, post processes, ...).
 */
config.lintModules.map(function(module) {
    // Task will be like moduleName-circularDependencies
    gulp.task(module + "-circularDependencies", function(cb) {
        var settings = config[module];

        dependencies(settings, module, cb);
    });
});

/**
 * Full Librairies tsLint.
 */
gulp.task("circularDependencies",
    gulp.series(config.lintModules.map((module) => {
        return module + "-circularDependencies";
    })
));
