window.__karma__.loaded = function () { };

// Loading tests
var xhr = new XMLHttpRequest();

xhr.open("GET", "/tests/validation/config.json", true);


xhr.addEventListener("load", function () {
    if (xhr.status === 200) {

        config = JSON.parse(xhr.responseText);

        describe("Validation Tests", function () {
            before(function (done) {
                window.disableWebGL2Support = (window.__karma__.config.args && window.__karma__.config.args.indexOf('--disableWebGL2Support') > -1) ? 
                    true :
                    false;

                this.timeout(180000);
                require = null;
                BABYLONDEVTOOLS.Loader
                    .require('/tests/validation/validation.js')
                    .testMode()
                    .useDist()
                    .load(function () {
                        var info = engine.getGlInfo();
                        console.log("Webgl Version: " + info.version);
                        console.log("Webgl Vendor: " + info.vendor);
                        console.log("Webgl Renderer: " + info.renderer);
                        done();
                    });
            });

            // Run tests
            for (let index = 0; index < config.tests.length; index++) {
                var test = config.tests[index];
                if (test.onlyVisual || test.excludeFromAutomaticTesting) {
                    continue;
                }

                it(test.title, function (done) {
                    this.timeout(180000);

                    var deferredDone = function(err) {
                        setTimeout(function() {
                            done(err);
                        }, 3000);
                    }

                    try {
                        runTest(index, function(result, screenshot) {
                            try {
                                expect(result).to.be.true; 
                                deferredDone();
                            }
                            catch (e) {
                                if (screenshot) {
                                    console.error(screenshot);
                                }
                                deferredDone(e);
                            }
                        });
                    }
                    catch (e) {
                        deferredDone(e);
                    }
                });
            };
        });

        window.__karma__.start();
    }
}, false);

xhr.send();