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

    if (cruiseResult.summary.error > 0) {
        var errors = cruiseResult.summary.violations;
        var errorCount = cruiseResult.summary.error;

        // Comparaison to remove once all done.
        // Comparaison to remove once all done.
        // Comparaison to remove once all done.
        var comparaisonData = { };
        for (let error of cruiseResult.summary.violations) {
            comparaisonData[error.from] = comparaisonData[error.from] || [];
            comparaisonData[error.from].push(error.to);
        }

        var fs = require("fs-extra");
        var baseValidationFile = "../../Config/tempCircularValidation/" + moduleName + ".json";
        if (fs.existsSync(path.resolve(__dirname, baseValidationFile))) {
            var baseValidation = require(baseValidationFile);
            errors = [];
            for (let error in comparaisonData) {
                if (!baseValidation[error]) {
                    for (let errorTo of comparaisonData[error]) {
                        errors.push({
                            from: error,
                            to: errorTo
                        });
                    }
                }
                else {
                    if (JSON.stringify(comparaisonData[error])!=JSON.stringify(baseValidation[error])) {
                        for (let errorTo of comparaisonData[error]) {
                            if (baseValidation[error].indexOf(errorTo) === -1) {
                                errors.push({
                                    from: error,
                                    to: errorTo
                                });
                            }
                        }
                    }
                }
            }
            errorCount = errors.length;
        }

        var minimist = require("minimist");
        var commandLineOptions = minimist(process.argv.slice(2), {
            boolean: ["saveCircular"]
        });
        if (commandLineOptions.saveCircular) {
            fs.writeJSONSync(path.resolve(__dirname, baseValidationFile), comparaisonData, {
                spaces: 4,
                EOL: '\n'
            });
        }
        // End Comparaison to remove once all done.
        // End Comparaison to remove once all done.
        // End Comparaison to remove once all done.

        if (errorCount > 0) {
            colorConsole.error(`New circular dependencies in ${moduleName.cyan}: ${("" + errorCount).red}`);
            for (let error of errors) {
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
