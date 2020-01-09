"use strict";

var currentViewer;
var viewerElement;
var currentScene;
var config;
var justOnce;

var threshold = 25;
var errorRatio = 1.5;

// Overload the random to make it deterministic
var seed = 100000,
    constant = Math.pow(2, 13) + 1,
    prime = 37,
    maximum = Math.pow(2, 50);

Math.random = function () {
    seed *= constant;
    seed += prime;
    seed %= maximum;

    return seed / maximum;
}

function compare(renderData, referenceCanvas) {
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
        differencesCount++;
    }

    referenceContext.putImageData(referenceData, 0, 0);

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

function downloadDataUrlFromJavascript(filename, dataUrl) {

    // Construct the 'a' element
    var link = document.createElement("a");
    link.download = filename;
    link.target = "_blank";

    // Construct the URI
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();

    // Cleanup the DOM
    document.body.removeChild(link);
}

function evaluate(test, resultCanvas, result, renderImage, index, waitRing, done) {
    seed = 100000;
    var renderData = getRenderData(currentViewer.canvas, currentViewer.engine);
    var testRes = true;

    // gl check
    var gl = currentViewer.engine._gl;
    var err = gl.getError();
    if (err !== 0) {
        result.classList.add("failed");
        result.innerHTML = "×";
        testRes = false;
        console.log('%c failed (gl error: ' + err + ')', 'color: red');
    } else {

        // Visual check
        if (!test.onlyVisual) {
            if (compare(renderData, resultCanvas)) {
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

    var renderB64 = saveRenderImage(renderData, currentViewer.canvas);
    renderImage.src = renderB64;

    // save all reference images
    // downloadDataUrlFromJavascript(test.referenceImage, renderB64)

    done(testRes, renderB64);
}

function runTest(index, done) {
    if (index >= config.tests.length) {
        done(false);
    }


    var test = Object.assign({}, config.tests[index]);

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

    title.innerHTML = test.title;

    console.log("Running " + test.title);

    var resultContext = resultCanvas.getContext("2d");
    var img = new Image();
    img.onload = function () {
        resultCanvas.width = img.width;
        resultCanvas.height = img.height;
        resultContext.drawImage(img, 0, 0);
    }

    img.src = "/tests/validation/ReferenceImages/" + test.referenceImage;

    var renderImage = new Image();
    renderImage.className = "renderImage";
    container.appendChild(renderImage);

    location.href = "#" + container.id;

    //run a single test
    var configuration = test.configuration || {};

    configuration.engine = configuration.engine || {};
    configuration.engine.engineOptions = configuration.engine.engineOptions || {};
    configuration.engine.engineOptions.preserveDrawingBuffer = true;
    // configuration.engine.engineOptions.disableWebGL2Support = true;

    //cancel camera behvaviors for the tests
    configuration.camera = configuration.camera || {};
    configuration.camera.behaviors = null;

    // make sure we use only local assets

    //envirnonment directory
    configuration.scene = configuration.scene || {};
    configuration.scene.assetsRootURL = "https://viewer.babylonjs.com/assets/environment/";
    if (!test.enableEnvironment) {
        configuration.environmentMap = false;
    } else {
        console.log(configuration.environmentMap)
    }

    //model config
    configuration.model = configuration.model || {};
    //configuration.model.castShadow = !test.createMesh
    configuration.model.entryAnimation = false;

    // create a new viewer
    currentViewer && currentViewer.dispose();
    currentViewer && currentViewer.engine.dispose();

    setTimeout(() => {
        currentViewer = null;
        currentScene = null;
        viewerElement.innerHTML = '';
        currentViewer = new BabylonViewer.DefaultViewer(viewerElement, configuration);

        currentViewer.onInitDoneObservable.add(() => {

            var currentFrame = 0;
            var waitForFrame = test.waitForFrame || 0;

            currentViewer.onModelLoadedObservable.add((model) => {
                console.log("model loaded");
                currentViewer.onFrameRenderedObservable.add(() => {
                    console.log("frame rendered", currentFrame, model.meshes.every(m => m.isReady()));
                    if (test.animationTest && !currentFrame) {
                        model.playAnimation(model.getAnimationNames()[0]);
                    }
                    if (currentFrame === waitForFrame) {
                        currentViewer.onFrameRenderedObservable.clear();
                        currentViewer.sceneManager.scene.executeWhenReady(() => {
                            evaluate(test, resultCanvas, result, renderImage, index, waitRing, done);
                        });
                    }
                    currentFrame++;
                });
            });

            if (test.model) {
                currentViewer.initModel(test.model);
            } else if (test.createMesh) {
                prepareMeshForViewer(currentViewer, configuration, test);
            }
        });
    });
}

function prepareMeshForViewer(viewer, configuration, test) {
    let meshModel = new BabylonViewer.ViewerModel(viewer, configuration.model || {});

    let sphereMesh = BABYLON.Mesh.CreateSphere('sphere-' + test.title, 20, 1.0, viewer.sceneManager.scene);
    if (test.createMaterial) {
        let material = new BABYLON.PBRMaterial("sphereMat", viewer.sceneManager.scene);
        sphereMesh.material = material;
    }
    meshModel.addMesh(sphereMesh, true);
    meshModel.rootMesh.position.y = 0.5;
    console.log("sphere created");
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

    viewerElement = document.createElement("babylon");
    document.body.appendChild(viewerElement);

    // disable init
    BabylonViewer.viewerGlobals.disableInit = true;
}

init();

