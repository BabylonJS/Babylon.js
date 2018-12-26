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

        // Comparaison to remove once all done.
        // Comparaison to remove once all done.
        // Comparaison to remove once all done.
        var comparaisonData = { };
        for (let error of cruiseResult.summary.violations) {
            comparaisonData[error.from] = comparaisonData[error.from] || [];
            comparaisonData[error.from].push(error.to);
        }

        var fs = require("fs-extra");
        var baseValidationFile = "../../Config/" + moduleName + ".json";
        if (fs.existsSync(path.resolve(__dirname, baseValidationFile))) {
            var baseValidation = require(baseValidationFile);
            errors = [];
            for (let error in comparaisonData) {
                if (!baseValidation[error] || JSON.stringify(comparaisonData[error])!=JSON.stringify(baseValidation[error])) {
                    errors.push({
                        from: error.from,
                        to: error.to
                    });
                }
            }
        }
        else {
            errors = cruiseResult.summary.violations;
        }

        var minimist = require("minimist");
        var commandLineOptions = minimist(process.argv.slice(2), {
            boolean: ["saveCircular"]
        });
        if (commandLineOptions.saveCircular) {
            fs.writeJSONSync(path.resolve(__dirname, baseValidationFile), comparaisonData);
        }
        colorConsole.warn(`Still circular dependencies in ${moduleName.cyan}: ${("" + cruiseResult.summary.error).red}`);
        cb();
        return;
        // End Comparaison to remove once all done.
        // End Comparaison to remove once all done.
        // End Comparaison to remove once all done.

        colorConsole.error(`New circular dependencies in ${moduleName.cyan}: ${("" + cruiseResult.summary.error).red}`);
        for (let error of errors) {
            colorConsole.error(`    From: '${error.from.replace(/\.\.\//g, "").yellow}' To: '${error.to.replace(/\.\.\//g, "").yellow}'`);
        }
        process.exit(1);
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
