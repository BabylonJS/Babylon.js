window.__karma__.loaded = function () { };

window.validation = true;

window.onload = function () {
    // Loading tests
    var xhr = new XMLHttpRequest();

    xhr.open("GET", "/tests/validation/config.json", true);

    xhr.addEventListener("load", function () {
        if (xhr.status === 200) {

            config = JSON.parse(xhr.responseText);

            describe("Validation Tests", function () {
                // Run tests
                for (let index = 0; index < config.tests.length; index++) {
                    var test = config.tests[index];
                    if (test.onlyVisual || test.excludeFromAutomaticTesting) {
                        continue;
                    }

                    it(test.title, function (done) {
                        this.timeout(60000);

                        var deferredDone = function (err) {
                            setTimeout(function () {
                                done(err);
                            }, 1000);
                        }

                        try {
                            runTest(index, function (result, screenshot) {
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
}
