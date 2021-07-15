"use strict";

var engine;
var canvas;
var currentScene;
var config;
var justOnce;
var engineName;
var currentTestName;
var numTestsOk = 0;
var failedTests = [];

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

    var curErrorRatio = (differencesCount * 100) / (width * height);

    if (differencesCount) {
        console.log("%c Pixel difference: " + differencesCount + " pixels. Error ratio=" + curErrorRatio.toFixed(4) + "%", 'color: orange');
    }

    return curErrorRatio > errorRatio;
}

async function getRenderData(canvas, engine) {
    var width = canvas.width;
    var height = canvas.height;

    return new Promise((resolve) => {
        engine.onEndFrameObservable.addOnce(async () => {
            var renderData = await engine.readPixels(0, 0, width, height);
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
            if (engine.isWebGPU) {
                for (var i = 0; i < width * height * 4; i += 4) {
                    var temp = renderData[i + 0];
                    renderData[i + 0] = renderData[i + 2];
                    renderData[i + 2] = temp;
                }
            }

            resolve(renderData);
        });
    });
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

async function evaluate(test, resultCanvas, result, renderImage, waitRing, done) {
    var renderData = await getRenderData(canvas, engine);
    var testRes = true;

    var dontReportTestOutcome = false;
    if (config.qs && config.qs.checkresourcecreation && engine.countersLastFrame) {
        if (BABYLON.WebGPUCacheBindGroups.NumBindGroupsCreatedLastFrame > 0 || engine.countersLastFrame.numEnableEffects > 0) {
            console.warn(`check resource creation: numBindGroupsCreation=${BABYLON.WebGPUCacheBindGroups.NumBindGroupsCreatedLastFrame}, numEnableEffects=${engine.countersLastFrame.numEnableEffects}`);
            testRes = false;
        }
        dontReportTestOutcome = true;
    }

    // gl check
    var gl = engine._gl, glError = gl ? gl.getError() : 0;
    if (gl && glError !== 0) {
        result.classList.add("failed");
        result.innerHTML = "×";
        testRes = false;
        console.log(`%c failed (gl error: ${glError})`, 'color: red');
    } else {

        // Visual check
        if (!test.onlyVisual) {
            var info = engine.getGlInfo();
            var defaultErrorRatio = 2.5

            if ((dontReportTestOutcome && !testRes) || !dontReportTestOutcome && compare(renderData, resultCanvas, test.threshold || 25, test.errorRatio || defaultErrorRatio)) {
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

    if (!dontReportTestOutcome) {
        var renderB64 = saveRenderImage(renderData, canvas);
        renderImage.src = renderB64;
    }

    currentScene.dispose();
    currentScene = null;
    engine.setHardwareScalingLevel(1);
    if (engine.useReverseDepthBuffer) {
        engine.setDepthFunction(BABYLON.Constants.GEQUAL);
    } else {
        engine.setDepthFunction(BABYLON.Constants.LEQUAL);
    }

    engine.applyStates();

    engine._deltaTime = 0;
    engine._fps = 60;
    engine._performanceMonitor = new BABYLON.PerformanceMonitor();

    if (resultCanvas.parentElement) {
        resultCanvas.parentElement.setAttribute("result", testRes);
    }

    if (!dontReportTestOutcome) {
        if (testRes) {
            numTestsOk++;
        } else {
            failedTests.push(currentTestName);
        }
    }

    done(testRes, renderB64);
}

function processCurrentScene(test, resultCanvas, result, renderImage, index, waitRing, done) {
    currentScene.useConstantAnimationDeltaTime = true;
    var renderCount = test.renderCount || 1;

    if (config.qs && config.qs.checkresourcecreation) {
        renderCount = 50;
    }

    engine.endFrame();

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
                engine.stopRenderLoop();
                console.error(e);
                failedTests.push(currentTestName);
                done(false);
            }
        });

    });
}

function runTest(index, done, listname) {
    if (index >= config.tests.length) {
        done(false);
    }

    const excludedEngines = config.tests[index].excludedEngines;
    if (Array.isArray(excludedEngines) && excludedEngines.indexOf(engineName) >= 0) {
        done(true);
        return;
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

    console.log("Running " + (listname ? listname + "/" : "") + test.title);

    currentTestName = test.title;

    engine.beginFrame();

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
                    failedTests.push(currentTestName);
                    done(false);
                });
        }
        else if (test.playgroundId) {
            if (test.playgroundId[0] !== "#" || test.playgroundId.indexOf("#", 1) === -1) {
                test.playgroundId += "#0";
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
                    failedTests.push(currentTestName);
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
                        failedTests.push(currentTestName);
                        done(false);
                    }
                }
            };
            request.onerror = function() {
                console.error("Network error during test load.");
                failedTests.push(currentTestName);
                done(false);
            }

            request.send(null);

        }
    }

    img.src = "/tests/validation/ReferenceImages/" + (listname ? listname + "/" : "") + (test.referenceImage ? test.referenceImage : test.title + ".png");

}

function GetAbsoluteUrl(url) {
    const a = document.createElement("a");
    a.href = url;
    return a.href;
}

function init(_engineName, useReverseDepthBuffer) {
    _engineName = _engineName ? _engineName.toLowerCase() : "webgl2";
    if (window.disableWebGL2Support) {
        _engineName = "webgl1";
    }
    if (_engineName === "webgl") {
        _engineName = "webgl1";
    }

    engineName = _engineName;

    BABYLON.SceneLoader.ShowLoadingScreen = false;
    BABYLON.SceneLoader.ForceFullSceneLoadingForIncremental = true;

    BABYLON.DracoCompression.Configuration.decoder = {
        wasmUrl: GetAbsoluteUrl("../../dist/preview%20release/draco_wasm_wrapper_gltf.js"),
        wasmBinaryUrl: GetAbsoluteUrl("../../dist/preview%20release/draco_decoder_gltf.wasm"),
        fallbackUrl: GetAbsoluteUrl("../../dist/preview%20release/draco_decoder_gltf.js")
    };
    BABYLON.GLTFValidation.Configuration = {
        url: GetAbsoluteUrl("../../dist/preview%20release/gltf_validator.js")
    };
    BABYLON.GLTF2.Loader.Extensions.EXT_meshopt_compression.DecoderPath =
        GetAbsoluteUrl("../../dist/preview%20release/meshopt_decoder.js");
    BABYLON.KhronosTextureContainer2.URLConfig = {
        jsDecoderModule: GetAbsoluteUrl("../../dist/preview%20release/babylon.ktx2Decoder.js"),
        wasmUASTCToASTC: GetAbsoluteUrl("../../dist/preview%20release/ktx2Transcoders/uastc_astc.wasm"),
        wasmUASTCToBC7: GetAbsoluteUrl("../../dist/preview%20release/ktx2Transcoders/uastc_bc7.wasm"),
        wasmUASTCToRGBA_UNORM: GetAbsoluteUrl("../../dist/preview%20release/ktx2Transcoders/uastc_rgba32_unorm.wasm"),
        wasmUASTCToRGBA_SRGB: GetAbsoluteUrl("../../dist/preview%20release/ktx2Transcoders/uastc_rgba32_srgb.wasm"),
        jsMSCTranscoder: GetAbsoluteUrl("../../dist/preview%20release/ktx2Transcoders/msc_basis_transcoder.js"),
        wasmMSCTranscoder: GetAbsoluteUrl("../../dist/preview%20release/ktx2Transcoders/msc_basis_transcoder.wasm"),
        wasmZSTDDecoder: GetAbsoluteUrl("../../dist/preview%20release/zstddec.wasm"),
    };

    BABYLON.KhronosTextureContainer2.URLConfig = {
        jsDecoderModule: GetAbsoluteUrl("../../dist/preview%20release/babylon.ktx2Decoder.js"),
        wasmUASTCToASTC: GetAbsoluteUrl("../../dist/preview%20release/ktx2Transcoders/uastc_astc.wasm"),
        wasmUASTCToBC7: GetAbsoluteUrl("../../dist/preview%20release/ktx2Transcoders/uastc_bc7.wasm"),
        wasmUASTCToRGBA_UNORM: GetAbsoluteUrl("../../dist/preview%20release/ktx2Transcoders/uastc_rgba32_unorm.wasm"),
        wasmUASTCToRGBA_SRGB: GetAbsoluteUrl("../../dist/preview%20release/ktx2Transcoders/uastc_rgba32_srgb.wasm"),
        jsMSCTranscoder: GetAbsoluteUrl("../../dist/preview%20release/ktx2Transcoders/msc_basis_transcoder.js"),
        wasmMSCTranscoder: GetAbsoluteUrl("../../dist/preview%20release/ktx2Transcoders/msc_basis_transcoder.wasm"),
        wasmZSTDDecoder: GetAbsoluteUrl("../../dist/preview%20release/zstddec.wasm"),
    };

    canvas = document.createElement("canvas");
    canvas.className = "renderCanvas";
    document.body.appendChild(canvas);
    if (engineName === "webgpu") {
        const glslangOptions = { 
            jsPath: "../../dist/preview%20release/glslang/glslang.js",
            wasmPath: "../../dist/preview%20release/glslang/glslang.wasm"
        };

        const options = {
            deviceDescriptor: {
                requiredFeatures: [
                    "texture-compression-bc",
                    "timestamp-query",
                    "pipeline-statistics-query",
                    "depth-clamping",
                    "depth24unorm-stencil8",
                    "depth32float-stencil8"
                ]
            },
            antialiasing: false,
        };

        engine = new BABYLON.WebGPUEngine(canvas, options);
        engine.enableOfflineSupport = false;
        engine.useReverseDepthBuffer = useReverseDepthBuffer == 1 || useReverseDepthBuffer == "true";
        if (engine.useReverseDepthBuffer) console.log("Forcing reverse depth buffer in all tests");
        return new Promise((resolve) => {
            engine.initAsync(glslangOptions).then(() => resolve());
        });
    } else {
        engine = new BABYLON.Engine(canvas, false, { useHighPrecisionFloats: true, disableWebGL2Support: engineName === "webgl1" ? true : false });
        engine.enableOfflineSupport = false;
        engine.setDitheringState(false);
        engine.useReverseDepthBuffer = useReverseDepthBuffer == 1 || useReverseDepthBuffer == "true";
        if (engine.useReverseDepthBuffer) console.log("Forcing reverse depth buffer in all tests");
        return Promise.resolve();
    }
}

function showResultSummary() {
    console.log(`${numTestsOk} test(s) succeeded, ${failedTests.length} failed.`);
    if (failedTests.length > 0) {
        console.log(`List of failed test(s):\r\n  ${failedTests.join("\r\n  ")}`);
    }
}

function dispose() {
    engine.dispose();
    currentScene = null;
    engine = null;
    document.body.removeChild(canvas);
    canvas = null;
}
