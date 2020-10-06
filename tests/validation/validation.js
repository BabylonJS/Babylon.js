"use strict";

var engine;
var canvas;
var currentScene;
var config;
var justOnce;

// Random replacement
var seed = 1;
Math.random = function() {
    var x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
}

function compare(renderData, referenceCanvas, threshold, errorRatio) {
    var width = referenceCanvas.width;
    var height = referenceCanvas.height;
    var size = width * height * 4;

    var referenceContext = referenceCanvas.getContext("2d");

    var referenceData = referenceContext.getImageData(0, 0, width, height);

    var differencesCount = 0;
    for (var index = 0; index < size; index += 4) {
        if (Math.abs(renderData[index] - referenceData.data[index]) < threshold &&
            Math.abs(renderData[index + 1] - referenceData.data[index + 1]) < threshold &&
            Math.abs(renderData[index + 2] - referenceData.data[index + 2]) < threshold) {
            continue;
        }

        referenceData.data[index] = 255;
        referenceData.data[index + 1] *= 0.5;
        referenceData.data[index + 2] *= 0.5;
        referenceData.data[index + 3] = 255;
        differencesCount++;
    }

    referenceContext.putImageData(referenceData, 0, 0);

    if (differencesCount) {
        console.log("%c Pixel difference: " + differencesCount + " pixels.", 'color: orange');
    }

    return (differencesCount * 100) / (width * height) > errorRatio;
}

function getRenderData(canvas, engine) {
    var width = canvas.width;
    var height = canvas.height;

    var renderData = engine.readPixels(0, 0, width, height);
    var numberOfChannelsByLine = width * 4;
    var halfHeight = height / 2;

    for (var i = 0; i < halfHeight; i++) {
        for (var j = 0; j < numberOfChannelsByLine; j++) {
            var currentCell = j + i * numberOfChannelsByLine;
            var targetLine = height - i - 1;
            var targetCell = j + targetLine * numberOfChannelsByLine;

            var temp = renderData[currentCell];
            renderData[currentCell] = renderData[targetCell];
            renderData[targetCell] = temp;
        }
    }

    return renderData;
}

function saveRenderImage(data, canvas) {
    var width = canvas.width;
    var height = canvas.height;
    var screenshotCanvas = document.createElement('canvas');
    screenshotCanvas.width = width;
    screenshotCanvas.height = height;
    var context = screenshotCanvas.getContext('2d');

    var imageData = context.createImageData(width, height);
    var castData = imageData.data;
    castData.set(data);
    context.putImageData(imageData, 0, 0);

    return screenshotCanvas.toDataURL();
}

function evaluate(test, resultCanvas, result, renderImage, waitRing, done) {
    var renderData = getRenderData(canvas, engine);
    var testRes = true;

    // gl check
    var gl = engine._gl;
    if (gl.getError() !== 0) {
        result.classList.add("failed");
        result.innerHTML = "×";
        testRes = false;
        console.log('%c failed (gl error)', 'color: red');
    } else {

        // Visual check
        if (!test.onlyVisual) {
            var info = engine.getGlInfo();
            var defaultErrorRatio = 2.5

            if (compare(renderData, resultCanvas, test.threshold || 25, test.errorRatio || defaultErrorRatio)) {
                result.classList.add("failed");
                result.innerHTML = "×";
                testRes = false;
                console.log('%c failed', 'color: red');
            } else {
                result.innerHTML = "✔";
                testRes = true;
                console.log('%c validated', 'color: green');
            }
        }
    }
    waitRing.classList.add("hidden");

    var renderB64 = saveRenderImage(renderData, canvas);
    renderImage.src = renderB64;

    engine.applyStates();
    currentScene.dispose();
    currentScene = null;
    engine.setHardwareScalingLevel(1);

    done(testRes, renderB64);
}

function processCurrentScene(test, resultCanvas, result, renderImage, index, waitRing, done) {
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
                    evaluate(test, resultCanvas, result, renderImage, waitRing, done);
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

    // Clear the plugin activated observables in case it is registered in the test.
    BABYLON.SceneLoader.OnPluginActivatedObservable.clear();

    var test = config.tests[index];
    var container = document.createElement("div");
    container.id = "container#" + index;
    container.className = "container";
    document.body.appendChild(container);

    var titleContainer = document.createElement("div");
    titleContainer.className = "containerTitle";
    container.appendChild(titleContainer);

    var title = document.createElement("div");
    title.className = "title";
    titleContainer.appendChild(title);

    var result = document.createElement("div");
    result.className = "result";
    titleContainer.appendChild(result);

    var waitRing = document.createElement("img");
    waitRing.className = "waitRing";
    titleContainer.appendChild(waitRing);
    waitRing.src = "/tests/validation/loading.gif";

    var resultCanvas = document.createElement("canvas");
    resultCanvas.className = "resultImage";
    container.appendChild(resultCanvas);

    title.innerHTML = "#" + index + "> " + test.title;

    console.log("Running " + test.title);

    var resultContext = resultCanvas.getContext("2d");
    var img = new Image();
    img.onload = function() {
        resultCanvas.width = img.width;
        resultCanvas.height = img.height;
        resultContext.drawImage(img, 0, 0);

        var renderImage = new Image();
        renderImage.className = "renderImage";
        container.appendChild(renderImage);

        seed = 1;
        location.href = "#" + container.id;
       
        if (test.sceneFolder) {
            BABYLON.SceneLoader.Load(config.root + test.sceneFolder, test.sceneFilename, engine, function(newScene) {
                currentScene = newScene;
                processCurrentScene(test, resultCanvas, result, renderImage, index, waitRing, done);
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
                    done(false);
                }
            }

            var loadPG = function() {
                var xmlHttp = new XMLHttpRequest();
                xmlHttp.onreadystatechange = function() {
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

                            if (currentScene.then) {
                                // Handle if createScene returns a promise
                                currentScene.then(function(scene) {
                                    currentScene = scene;
                                    processCurrentScene(test, resultCanvas, result, renderImage, index, waitRing, done);
                                }).catch(function(e) {
                                    console.error(e);
                                    onError();
                                })
                            } else {
                                // Handle if createScene returns a scene
                                processCurrentScene(test, resultCanvas, result, renderImage, index, waitRing, done);
                            }
                        }
                        catch (e) {
                            console.error(e);
                            onError();
                        }
                    }
                }
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
    }

    img.src = "/tests/validation/ReferenceImages/" + test.referenceImage;

}

function init() {
    BABYLON.SceneLoader.ShowLoadingScreen = false;
    BABYLON.SceneLoader.ForceFullSceneLoadingForIncremental = true;

    BABYLON.DracoCompression.Configuration.decoder = {
        wasmUrl: "../../dist/preview%20release/draco_wasm_wrapper_gltf.js",
        wasmBinaryUrl: "../../dist/preview%20release/draco_decoder_gltf.wasm",
        fallbackUrl: "../../dist/preview%20release/draco_decoder_gltf.js"
    };

    BABYLON.GLTFValidation.Configuration = {
        url: "../../dist/preview%20release/gltf_validator.js"
    };

    canvas = document.createElement("canvas");
    canvas.className = "renderCanvas";
    document.body.appendChild(canvas);
    engine = new BABYLON.Engine(canvas, false, { useHighPrecisionFloats: true, disableWebGL2Support: window.disableWebGL2Support ? true : false });
    engine.enableOfflineSupport = false;
    engine.setDitheringState(false);
}

function dispose() {
    engine.dispose();
    currentScene = null;
    engine = null;
    document.body.removeChild(canvas);
    canvas = null;
}

init();
