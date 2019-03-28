// Import Dependencies.
var gulp = require("gulp");
var typescript = require("gulp-typescript");
var karmaServer = require('karma').Server;
var webpack = require('webpack');
var webpackStream = require("webpack-stream");
var rename = require("gulp-rename");

// Import Helpers.
var rmDir = require("../../NodeHelpers/rmDir");

// Read the full config.
var config = require("../../Config/config.json");
var relativeRootDir = "../../../";
var rootDir = __dirname + "/" + relativeRootDir;

/**
 * Launches the KARMA validation tests in chrome in order to debug them.
 */
gulp.task("tests-validation-karma", function(done) {
    var kamaServerOptions = {
        configFile: rootDir + "tests/validation/karma.conf.js",
        singleRun: false
    };

    var server = new karmaServer(kamaServerOptions, done);
    server.start();
});

/**
 * Launches the KARMA validation tests in ff or virtual screen ff on travis for a quick analysis during the build.
 */
gulp.task("tests-validation-virtualscreen", function(done) {
    var kamaServerOptions = {
        configFile: rootDir + "tests/validation/karma.conf.js",
        singleRun: true,
        browsers: ['Firefox']
    };

    var server = new karmaServer(kamaServerOptions, done);
    server.start();
});

/**
 * Launches the KARMA validation tests in ff or virtual screen ff on travis for a quick analysis during the build.
 */
gulp.task("tests-validation-virtualscreenWebGL1", function(done) {
    var kamaServerOptions = {
        configFile: rootDir + "tests/validation/karma.conf.js",
        singleRun: true,
        browsers: ['Firefox'],
        client: {
            args: ["--disableWebGL2Support"]
        },
        junitReporter: {
            outputDir: '.temp/testResults', // results will be saved as $outputDir/$browserName.xml
            outputFile: 'ValidationTests1.xml', // if included, results will be saved as $outputDir/$browserName/$outputFile
            suite: 'Validation Tests WebGL1', // suite will become the package name attribute in xml testsuite element
            useBrowserName: false, // add browser name to report and classes names
            nameFormatter: undefined, // function (browser, result) to customize the name attribute in xml testcase element
            classNameFormatter: undefined, // function (browser, result) to customize the classname attribute in xml testcase element
            properties: {} // key value pair of properties to add to the <properties> section of the report
        }
    };

    var server = new karmaServer(kamaServerOptions, done);
    server.start();
});

/**
 * Launches the KARMA validation tests in browser stack for remote and cross devices validation tests.
 */
gulp.task("tests-validation-browserstack", function(done) {
    if (!process.env.BROWSER_STACK_USERNAME) {
        done();
        return;
    }

    // not in safe build
    if (process.env.BROWSER_STACK_USERNAME === "$(babylon.browserStack.userName)") {
        done();
        return;
    }

    var kamaServerOptions = {
        configFile: rootDir + "tests/validation/karma.conf.browserstack.js",
        singleRun: true
    };

    var server = new karmaServer(kamaServerOptions, done);
    server.start();
});

/**
 * Transpiles typescript unit tests. 
 */
gulp.task("tests-unit-transpile", function(done) {
    var tsProject = typescript.createProject(rootDir + "tests/unit/tsconfig.json");

    var tsResult = gulp.src(rootDir + "tests/unit/**/*.ts", { base: relativeRootDir })
        .pipe(tsProject());

    tsResult.once("error", function() {
        tsResult.once("finish", function() {
            console.log("Typescript compile failed");
            process.exit(1);
        });
    });

    return tsResult.js.pipe(gulp.dest(relativeRootDir));
});

/**
 * Launches the KARMA unit tests in Chrome.
 */
gulp.task("tests-unit-debug", gulp.series("tests-unit-transpile", function(done) {
    var kamaServerOptions = {
        configFile: rootDir + "tests/unit/karma.conf.js",
        singleRun: false,
        browsers: ['Chrome']
    };

    var server = new karmaServer(kamaServerOptions, done);
    server.start();
}));

/**
 * Launches the KARMA unit tests in chrome headless.
 */
gulp.task("tests-babylon-unit", gulp.series("tests-unit-transpile", function(done) {
    var kamaServerOptions = {
        configFile: rootDir + "tests/unit/karma.conf.js",
        singleRun: true
    };

    var server = new karmaServer(kamaServerOptions, done);
    server.start();
}));

/**
 * Transpiles viewer typescript unit tests. 
 */
gulp.task("tests-viewer-validation-transpile", function() {

    let wpBuild = webpackStream(require(relativeRootDir + 'Viewer/webpack.gulp.config.js'), webpack);

    // clean the built directory
    rmDir("../../Viewer/tests/build/");

    return wpBuild
        .pipe(rename(function(path) {
            if (path.extname === '.js') {
                path.basename = "test";
            }
        }))
        .pipe(gulp.dest("../../Viewer/tests/build/"));
});

/**
 * Launches the viewer's KARMA validation tests in chrome in order to debug them.
 * (Can only be launch locally.)
 */
gulp.task("tests-viewer-validation-karma", gulp.series("tests-viewer-validation-transpile", function(done) {
    var kamaServerOptions = {
        configFile: rootDir + "Viewer/tests/validation/karma.conf.js",
        singleRun: false
    };

    var server = new karmaServer(kamaServerOptions, done);
    server.start();
}));

/**
 * Launches the KARMA validation tests in ff or virtual screen ff on travis for a quick analysis during the build.
 * (Can only be launch on any branches.)
 */
gulp.task("tests-viewer-validation-virtualscreen", gulp.series("tests-viewer-validation-transpile", function(done) {
    var kamaServerOptions = {
        configFile: rootDir + "Viewer/tests/validation/karma.conf.js",
        singleRun: true,
        browsers: ['Firefox']
    };

    var server = new karmaServer(kamaServerOptions, done);
    server.start();
}));

/**
 * Launches the KARMA validation tests in browser stack for remote and cross devices validation tests.
 * (Can only be launch from secure branches.)
 */
gulp.task("tests-viewer-validation-browserstack", gulp.series("tests-viewer-validation-transpile", function(done) {
    if (!process.env.BROWSER_STACK_USERNAME) {
        done();
        return;
    }

    var kamaServerOptions = {
        configFile: rootDir + "Viewer/tests/validation/karma.conf.browserstack.js",
        singleRun: true
    };

    var server = new karmaServer(kamaServerOptions, done);
    server.start();
}));

/**
 * Transpiles viewer typescript unit tests. 
 */
gulp.task("tests-viewer-transpile", function() {

    let wpBuild = webpackStream(require(relativeRootDir + 'Viewer/tests/unit/webpack.config.js'), webpack);

    // clean the built directory
    rmDir("../../Viewer/tests/build/");

    return wpBuild
        .pipe(rename(function(path) {
            if (path.extname === '.js') {
                path.basename = "test";
            }
        }))
        .pipe(gulp.dest("../../Viewer/tests/build/"));
});

/**
 * Launches the KARMA unit tests in chrome.
 * (Can be launch on any branches.)
 */
gulp.task("tests-viewer-unit-debug", gulp.series("tests-viewer-transpile", function(done) {
    var kamaServerOptions = {
        configFile: rootDir + "Viewer/tests/karma.conf.js",
        singleRun: false,
        browsers: ['Chrome']
    };

    var server = new karmaServer(kamaServerOptions, done);
    server.start();
}));

/**
 * Launches the KARMA unit tests in chrome headless.
 */
gulp.task("tests-viewer-unit", gulp.series("tests-viewer-transpile", function(done) {
    var kamaServerOptions = {
        configFile: rootDir + "Viewer/tests/karma.conf.js",
        singleRun: true
    };

    var server = new karmaServer(kamaServerOptions, done);
    server.start();
}));

/**
 * Launches the KARMA unit tests in chrome headless.
 */
gulp.task("tests-unit", gulp.series("tests-babylon-unit", "tests-viewer-unit"));

/**
 * Launches the KARMA module tests in chrome headless.
 */
gulp.task("tests-modules", function() {
    let testsToRun = require(relativeRootDir + 'tests/modules/tests.json');

    let sequencePromise = Promise.resolve();

    testsToRun.tests.forEach(test => {
        sequencePromise = sequencePromise.then(() => {
            console.log("Running " + test.name);
            let basePath = relativeRootDir + 'tests/modules/' + test.name + '/';
            
            rmDir("../../tests/modules/build/");
            let compilePromise = Promise.resolve();

            if (test.dependencies) {
                compilePromise = new Promise(function(resolve, reject) {
                    let counter = 0;
                    let copyTask = gulp.src(test.dependencies.map(dep => config.build.outputDirectory + '/' + dep)).pipe(rename(function(path) {
                        path.basename = (counter++) + '';
                    })).pipe(gulp.dest("../../tests/modules/build/dependencies/"))
                    copyTask.once("finish", resolve);
                })
            }
            // any compilation needed?
            if (test.typescript || test.bundler) {
                //typescript only
                if (test.typescript && !test.bundler) {
                    compilePromise = compilePromise.then(() => {
                        return new Promise(function(resolve, reject) {
                            var gulpRelativeRootDir = "../../";
                            var gulpBasePath = gulpRelativeRootDir + 'tests/modules/' + test.name + '/';
                            var tsProject = typescript.createProject(gulpBasePath + (test.tsconfig || 'tsconfig.json'));

                            var tsResult = gulp.src(gulpBasePath + '/src/**/*.ts', { base: gulpBasePath })
                                .pipe(tsProject());

                            let error = false;
                            tsResult.once("error", function() {
                                error = true;
                            });

                            let jsPipe = tsResult.js.pipe(gulp.dest(gulpRelativeRootDir + "tests/modules/"));

                            jsPipe.once("finish", function() {
                                if (error)
                                    reject('error compiling test');
                                else
                                    resolve();
                            });
                        });
                    });
                } else {
                    if (test.bundler === 'webpack') {
                        console.log("webpack");
                        compilePromise = compilePromise.then(() => {
                            return new Promise(function(resolve, reject) {
                                let wpBuild = webpackStream(require(basePath + '/webpack.config.js'), webpack);

                                wpBuild = wpBuild
                                    .pipe(rename(function(path) {
                                        if (path.extname === '.js') {
                                            path.basename = "tests-loader";
                                        }
                                    }))
                                    .pipe(gulp.dest("../../tests/modules/build/"));

                                wpBuild.once("finish", resolve);
                            })
                        });
                    }
                }
            }

            return compilePromise.then(() => {
                return new Promise(function(resolve, reject) {
                    var kamaServerOptions = {
                        configFile: rootDir + "tests/modules/karma.conf.js",

                        junitReporter: {
                            outputDir: '.temp/testResults', // results will be saved as $outputDir/$browserName.xml
                            outputFile:  test.reportName + '.xml', // if included, results will be saved as $outputDir/$browserName/$outputFile
                            suite: test.displayName, // suite will become the package name attribute in xml testsuite element
                            useBrowserName: false, // add browser name to report and classes names
                            nameFormatter: undefined, // function (browser, result) to customize the name attribute in xml testcase element
                            classNameFormatter: undefined, // function (browser, result) to customize the classname attribute in xml testcase element
                            properties: {} // key value pair of properties to add to the <properties> section of the report
                        },
                    };

                    var server = new karmaServer(kamaServerOptions, (err) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve();
                        }
                    });
                    server.start();
                });
            })
        })
    });

    return sequencePromise;
});