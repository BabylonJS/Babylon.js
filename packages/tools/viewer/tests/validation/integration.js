window.__karma__.loaded = function () { };

window.validation = true;

window.onload = function () {
    // Loading tests
    var xhr = new XMLHttpRequest();

    xhr.open("GET", "/tests/validation/config.json", true);

    xhr.addEventListener("load", function () {
        if (xhr.status === 200) {

            config = JSON.parse(xhr.responseText);

            config.tests.forEach(function (test, index) {
                if (test.repeatVariables) {
                    let paramsArray = [];
                    var variables = test.repeatVariables.split(",");
                    var repeatTimes = test.repeatTimes.split(",").map(s => +s);

                    for (var i = 0; i < repeatTimes[0]; ++i) {
                        if (repeatTimes[1]) {
                            for (var j = 0; j < repeatTimes[1]; ++j) {
                                var obj = {};
                                obj[variables[0]] = i;
                                obj[variables[1]] = j;
                                paramsArray.push(obj);
                            }
                        } else {
                            var obj = {};
                            obj[variables[0]] = i;
                            paramsArray.push(obj);
                        }
                    }
                    paramsArray.forEach(function (params) {

                        let newTest = processTest(test, "", params);
                        delete newTest.repeatVariables;
                        config.tests.push(newTest);
                    });
                }
            });

            describe("Validation Tests", function () {
                // Run tests
                config.tests.forEach(function (test, index) {
                    if (test.repeatVariables || test.onlyVisual || test.excludeFromAutomaticTesting) {
                        return;
                    }

                    it(test.title, function (done) {
                        this.timeout(60000);
                        var self = this;

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
                                        //console.error(screenshot);
                                    }
                                    deferredDone(e);
                                }
                            });

                        }
                        catch (e) {
                            deferredDone(e);
                        }
                    });
                });
            });

            window.__karma__.start();
        }
    }, false);


    xhr.send();
}

function processTest(test, key, params) {
    if (!key) {
        let testCopy = Object.assign({}, test);
        Object.keys(testCopy).forEach(testKey => {
            testCopy[testKey] = processTest(testCopy, testKey, params);
        });
        return testCopy;
    } else {
        if (typeof test[key] === "object") {
            let testCopy = Object.assign({}, test[key]);
            Object.keys(testCopy).forEach(testKey => {
                testCopy[testKey] = processTest(testCopy, testKey, params);
            });
            return testCopy;
        } else if (typeof test[key] === "string") {
            let evals = test[key].match(/{{\s*([^{}]+)\s*}}/g);
            if (evals) {
                let clean = evals.map(function (x) { var s = x.replace(/}/g, "").replace(/{/g, ""); return s; });
                evals.forEach((ev, idx) => {
                    var valuated = clean[idx];
                    Object.keys(params).forEach(p => {
                        valuated = valuated.replace(p, "" + params[p]);
                    });
                    valuated = eval(valuated);
                    test[key] = test[key].replace(ev, valuated);
                });
                test[key] = parseFloat(test[key]) || test[key];
            }

            return test[key];
        }
        else return test[key];
    }
}