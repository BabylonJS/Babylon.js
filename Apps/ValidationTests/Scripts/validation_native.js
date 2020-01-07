var engine;
var currentScene;
var config;
var justOnce;
var threshold = 25;
var errorRatio = 2.5;

function compare(test, canvasImageData, referenceImage) {
    var renderData = engine._native.getImageData(canvasImageData);
    var size = renderData.length;
    var referenceData ={data: engine._native.getImageData(referenceImage)};
    var differencesCount = 0;
    
    for (var index = 0; index < size; index += 4) {
        if (Math.abs(renderData[index] - referenceData.data[index]) < threshold &&
            Math.abs(renderData[index + 1] - referenceData.data[index + 1]) < threshold &&
            Math.abs(renderData[index + 2] - referenceData.data[index + 2]) < threshold) {
            continue;
        }

        if (differencesCount === 0) {
            console.log(`First pixel off at ${index}: Value: (${renderData[index]}, ${renderData[index + 1]}, ${renderData[index] + 2}) - Expected: (${referenceData.data[index]}, ${referenceData.data[index + 1]}, ${referenceData.data[index + 2]}) `);
        }

        referenceData.data[index] = 255;
        referenceData.data[index + 1] *= 0.5;
        referenceData.data[index + 2] *= 0.5;
        differencesCount++;
    }

    if (differencesCount) {
        console.log("%c Pixel difference: " + differencesCount + " pixels.", 'color: orange');
    }
    
    let error = (differencesCount * 100) / (size / 4) > errorRatio;

    if (error) {
        TestUtils.writePNG(referenceData.data, 600, 400, "Error "+test.title+".png");
    }
    return error;
}

function evaluate(test, resultCanvas, result, referenceImage, index, waitRing, done) {
    var canvasImageData = engine._native.getFramebufferData(0,0, engine._native.getRenderWidth(), engine._native.getRenderHeight());
    var testRes = true;
    // Visual check
    if (!test.onlyVisual) {
        if (compare(test, canvasImageData, referenceImage)) {
            testRes = false;
            console.log('%c failed', 'color: red');
        } else {
            testRes = true;
            console.log('%c validated', 'color: green');
        }
    }

    currentScene.dispose();
    currentScene = null;
    engine.setHardwareScalingLevel(1);

    done(testRes);
}

function processCurrentScene(test, resultCanvas, result, referenceImage, index, waitRing, done) {
    currentScene.useConstantAnimationDeltaTime = true;
    var renderCount = test.renderCount || 1;
    currentScene.executeWhenReady(function() {
        
        if (currentScene.activeCamera && currentScene.activeCamera.useAutoRotationBehavior) {
            currentScene.activeCamera.useAutoRotationBehavior = false;
        }
        engine.runRenderLoop(function() {
            try {
                currentScene.render();
                renderCount--;
                if (renderCount === 0) {
                    engine.stopRenderLoop();
                    evaluate(test, resultCanvas, result, referenceImage, index, waitRing, done);
                }
            }
            catch (e) {
                console.error(e);
                done(false);
            }
        });

    });
}

function runTest(index, done) {
    if (index >= config.tests.length) {
        done(false);
    }

    var test = config.tests[index];

    let testInfo = "Running " + test.title;
    console.log(testInfo);
    TestUtils.setTitle(testInfo);
    
    seed = 100000;

    let onLoadFileError = function(request, exception) {
        console.log("Failed to retrieve " + url + ".", exception);
    };
    var onload = function(data, responseURL) {
        if (typeof (data) === "string") {
            throw new Error("Decode Image from string data not yet implemented.");
        }

        var referenceImage = engine._native.decodeImage(data);
        
        if (test.sceneFolder) {
            BABYLON.SceneLoader.Load(config.root + test.sceneFolder, test.sceneFilename, engine, function(newScene) {
                currentScene = newScene;
                processCurrentScene(test, resultCanvas, result, referenceImage, index, waitRing, done);
            },
                null,
                function(loadedScene, msg) {
                    console.error(msg);
                    done(false);
                });
        }
        else if (test.playgroundId) {
            if (test.playgroundId[0] !== "#" || test.playgroundId.indexOf("#", 1) === -1) {
                console.error("Invalid playground id");
                done(false);
                return;
            }

            var snippetUrl = "https://snippet.babylonjs.com";
            var pgRoot = "/Playground"

            var retryTime = 500;
            var maxRetry = 5;
            var retry = 0;

            var onError = function() {
                retry++;
                if (retry < maxRetry) {
                    setTimeout(function() {
                        loadPG();
                    }, retryTime);
                }
                else {
                    // Skip the test as we can not fetch the source.
                    done(true);
                }
            }

            var loadPG = function() {
                var xmlHttp = new XMLHttpRequest();
                xmlHttp.addEventListener("readystatechange", function() {
                    if (xmlHttp.readyState === 4) {
                        try {
                            xmlHttp.onreadystatechange = null;
                            var snippet = JSON.parse(xmlHttp.responseText);
                            var code = JSON.parse(snippet.jsonPayload).code.toString();
                            code = code.replace(/\/textures\//g, pgRoot + "/textures/");
                            code = code.replace(/"textures\//g, "\"" + pgRoot + "/textures/");
                            code = code.replace(/\/scenes\//g, pgRoot + "/scenes/");
                            code = code.replace(/"scenes\//g, "\"" + pgRoot + "/scenes/");
                            if (test.replace) {
                                var split = test.replace.split(",");
                                for (var i = 0; i < split.length; i += 2) {
                                    var source = split[i].trim();
                                    var destination = split[i + 1].trim();
                                    code = code.replace(source, destination);
                                }
                            }
                            currentScene = eval(code + "\r\ncreateScene(engine)");
                            var resultCanvas = 0;
                            var result;
                            var waitRing;
                            
                            if (currentScene.then) {
                                // Handle if createScene returns a promise
                                currentScene.then(function(scene) {
                                    currentScene = scene;
                                    processCurrentScene(test, resultCanvas, result, referenceImage, index, waitRing, done);
                                }).catch(function(e) {
                                    console.error(e);
                                    onError();
                                })
                            } else {
                                // Handle if createScene returns a scene
                                processCurrentScene(test, resultCanvas, result, referenceImage, index, waitRing, done);
                            }
                            
                        }
                        catch (e) {
                            console.error(e);
                            onError();
                        }
                    }
                }, false);
                xmlHttp.onerror = function() {
                    console.error("Network error during test load.");
                    onError();
                }
                xmlHttp.open("GET", snippetUrl + test.playgroundId.replace(/#/g, "/"));
                xmlHttp.send();
            }
            loadPG();
        } else {
            // Fix references
            if (test.specificRoot) {
                BABYLON.Tools.BaseUrl = config.root + test.specificRoot;
            }
            
            var request = new XMLHttpRequest();
            request.open('GET', config.root + test.scriptToRun, true);

            request.onreadystatechange = function() {
                if (request.readyState === 4) {
                    try {
                        request.onreadystatechange = null;

                        var scriptToRun = request.responseText.replace(/..\/..\/assets\//g, config.root + "/Assets/");
                        scriptToRun = scriptToRun.replace(/..\/..\/Assets\//g, config.root + "/Assets/");
                        scriptToRun = scriptToRun.replace(/\/assets\//g, config.root + "/Assets/");

                        if (test.replace) {
                            var split = test.replace.split(",");
                            for (var i = 0; i < split.length; i += 2) {
                                var source = split[i].trim();
                                var destination = split[i + 1].trim();
                                scriptToRun = scriptToRun.replace(source, destination);
                            }
                        }

                        if (test.replaceUrl) {
                            var split = test.replaceUrl.split(",");
                            for (var i = 0; i < split.length; i++) {
                                var source = split[i].trim();
                                var regex = new RegExp(source, "g");
                                scriptToRun = scriptToRun.replace(regex, config.root + test.rootPath + source);
                            }
                        }

                        currentScene = eval(scriptToRun + test.functionToCall + "(engine)");
                        processCurrentScene(test, resultCanvas, result, renderImage, index, waitRing, done);
                    }
                    catch (e) {
                        console.error(e);
                        done(false);
                    }
                }
            };
            request.onerror = function() {
                console.error("Network error during test load.");
                done(false);
            }

            request.send(null);
        }
    };
    
    let url = "https://raw.githubusercontent.com/BabylonJS/Babylon.js/master/tests/validation/ReferenceImages/" + test.referenceImage;
    BABYLON.Tools.LoadFile(url, onload, undefined, undefined, /*useArrayBuffer*/true, onLoadFileError);
}

var engine = new BABYLON.NativeEngine();
var scene = new BABYLON.Scene(engine);
var canvas = window;

OffscreenCanvas = function (width, height) {
    return {width:width
    , height:height
    , getContext: function(type) { return {
        fillRect: function(x, y, w, h) {}
        , measureText: function(text) { return 8; }
        , fillText: function(text, x, y) {}
    }; 
    }

    };
}

var xhr = new XMLHttpRequest();

xhr.open("GET", "https://raw.githubusercontent.com/BabylonJS/Babylon.js/master/tests/validation/config.json", true);

xhr.addEventListener("readystatechange", function() {
    if (xhr.status === 200) {
        config = JSON.parse(xhr.responseText);
        // Run tests
        var index = 0;

        var recursiveRunTest = function(i) {
            runTest(i, function(status) {
                if (!status)
                {
                    TestUtils.exit(-1);
                }
                i++;
                if (justOnce || i >= config.tests.length) {
                    TestUtils.exit(0);
                    return;
                }
                recursiveRunTest(i);
            });
        }

        recursiveRunTest(index);
    }
}, false);

console.log("Starting");
TestUtils.setTitle("Starting Native Validation Tests");
TestUtils.updateSize(600, 400);
xhr.send();

