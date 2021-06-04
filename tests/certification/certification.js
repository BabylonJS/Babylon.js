"use strict";

let debug = false;
let dist = true;
let numTestsOk = 0;
const failedTests = [];
const renderImages = [];

function checkUrl() {
    const indexOf = location.href.indexOf("?");
    if (indexOf !== -1) {
        const params = location.href.substr(indexOf + 1).split("&");
        for (let index = 0; index < params.length; index++) {
            const param = params[index].split("=");
            const name = param[0];
            const value = param[1];
            switch (name) {
                case "debug": {
                    debug = (value === "true" ? true : false);
                }
                case "dist": {
                    dist = (value === "true" ? true : false);
                    break;
                }
            }
        }
    }
}

function download(blob, fileName) {
    if (navigator && navigator.msSaveBlob) {
        navigator.msSaveBlob(blob, fileName);
        return;
    }

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = fileName;
    a.addEventListener("click", () => {
        if (a.parentElement) {
            a.parentElement.removeChild(a);
        }
    });
    a.click();
    window.URL.revokeObjectURL(url);
}

function compare(renderCanvas, referenceCanvas, diffCanvas, threshold, errorRatio) {
    const width = renderCanvas.width;
    const height = renderCanvas.height;
    const size = width * height * 4;

    const diffContext = diffCanvas.getContext("2d");
    diffCanvas.width = width;
    diffCanvas.height = height;

    const renderContext = renderCanvas.getContext("2d");
    const renderData = renderContext.getImageData(0, 0, width, height);

    const referenceContext = referenceCanvas.getContext("2d");
    const referenceData = referenceContext.getImageData(0, 0, width, height);

    let differencesCount = 0;
    let maxDeltaE = 0;
    for (let index = 0; index < size; index += 4) {
        const renderLabColor = rgb2lab([renderData.data[index], renderData.data[index + 1], renderData.data[index + 2]]);
        const referenceLabColor = rgb2lab([referenceData.data[index], referenceData.data[index + 1], referenceData.data[index + 2]]);

        const currentDeltaE = deltaE(renderLabColor, referenceLabColor);
        maxDeltaE = Math.max(maxDeltaE, currentDeltaE);
        if (currentDeltaE < threshold) {
            continue;
        }

        referenceData.data[index] = 255;
        referenceData.data[index + 1] *= 0.5;
        referenceData.data[index + 2] *= 0.5;
        referenceData.data[index + 3] = 255;
        differencesCount++;
    }

    if (debug) {
        console.log(`Max deltaE: ${maxDeltaE}`);
    }

    diffContext.putImageData(referenceData, 0, 0);

    const curErrorRatio = (differencesCount * 100) / (width * height);

    if (differencesCount) {
        console.log(`%c Pixel difference: ${differencesCount} pixels. Error ratio=${curErrorRatio.toFixed(4)}%`, "color: orange");
    }

    return curErrorRatio > errorRatio;
}

function evaluate(test, renderCanvas, referenceCanvas, diffCanvas, result, waitRing) {
    let testResult = true;

    // Visual check
    const defaultErrorRatio = 2.5;
    if (compare(renderCanvas, referenceCanvas, diffCanvas, test.threshold || 25, test.errorRatio || defaultErrorRatio)) {
        result.classList.add("failed");
        result.innerHTML = "×";
        testResult = false;
        console.log("%c failed", "color: red");
    } else {
        result.innerHTML = "✔";
        testResult = true;
        console.log("%c validated", "color: green");
    }

    waitRing.classList.add("hidden");

    if (testResult) {
        numTestsOk++;
    } else {
        failedTests.push(test.title);
    }
}

function loadImage(src) {
    return new Promise(function (resolve, reject) {
        const img = new Image();

        img.onload = function () {
            resolve(img);
        };

        img.onerror = function (error) {
            reject(error);
        }
    
        img.src = src;
    });
}

function loadFrame(frame, src) {
    return new Promise(function (resolve) {
        frame.onload = function () {
            const BABYLONDEVTOOLS = frame.contentWindow.BABYLONDEVTOOLS;
            if (BABYLONDEVTOOLS) {
                BABYLONDEVTOOLS.Loader.onReady(function () {
                    resolve();
                });
            }
            else {
                resolve();
            }
        };

        frame.src = src;
    });
}

async function runTest(index) {
    const test = config.tests[index];

    const container = document.createElement("div");
    container.id = "container#" + index;
    container.className = "container";
    document.body.appendChild(container);

    // Title bar
    const titleContainer = document.createElement("div");
    titleContainer.className = "containerTitle";
    container.appendChild(titleContainer);

    const title = document.createElement("div");
    title.className = "title";
    title.innerHTML = "#" + index + "> " + test.title;
    titleContainer.appendChild(title);

    const result = document.createElement("div");
    result.className = "result";
    titleContainer.appendChild(result);

    const waitRing = document.createElement("img");
    waitRing.className = "waitRing";
    titleContainer.appendChild(waitRing);
    waitRing.src = "/tests/validation/loading.gif";

    const referenceCanvas = document.createElement("canvas");
    referenceCanvas.className = "referenceImage";
    container.appendChild(referenceCanvas);

    const renderFrame = document.createElement("iframe");
    renderFrame.className = "renderImage";
    container.appendChild(renderFrame);

    const diffCanvas = document.createElement("canvas");
    diffCanvas.className = "diffImage";
    container.appendChild(diffCanvas);

    console.log(`Running ${test.title}`);

    // Reference
    const referenceContext = referenceCanvas.getContext("2d");
    const referenceImage = await loadImage(test.referenceImage);
    referenceCanvas.width = referenceImage.width;
    referenceCanvas.height = referenceImage.height;
    referenceContext.drawImage(referenceImage, 0, 0);

    // Render
    renderFrame.width = referenceCanvas.clientWidth;
    renderFrame.height = referenceCanvas.clientHeight;
    const src = "../../sandbox/public/index-local.html?skybox=false&clearColor=FFFFFF&kiosk=true"
        + `&assetUrl=../../tests/certification/models/${test.model}`
        + `&environment=../../tests/certification/models/${test.environment || "Neutral.hdr"}`
        + `&camera=${test.camera || 0}`
        + (dist ? "&dist=true" : "");
    await loadFrame(renderFrame, src);
    const renderScreenshot = await renderFrame.contentWindow.BABYLON.Sandbox.CaptureScreenshotAsync({width: 1024, height: 1024});
    const renderCanvas = document.createElement("canvas");
    renderCanvas.className = "renderImage";
    const renderContext = renderCanvas.getContext("2d");
    const renderImage = await loadImage(renderScreenshot);
    renderCanvas.width = renderImage.width;
    renderCanvas.height = renderImage.height;
    renderContext.drawImage(renderImage, 0, 0);
    renderFrame.remove();
    container.appendChild(renderCanvas);

    // Diff
    evaluate(test, renderCanvas, referenceCanvas, diffCanvas, result, waitRing);

    renderImages.push({
    name: test.referenceImage.substr(test.referenceImage.lastIndexOf("/") + 1).replace("rr-", "c-"),
        base64Image: renderScreenshot
    });
}

function showResultSummary() {
    console.log(`${numTestsOk} test(s) succeeded, ${failedTests.length} failed.`);
    if (failedTests.length > 0) {
        console.log(`List of failed test(s):\r\n  ${failedTests.join("\r\n  ")}`);
    }
}

async function downloadResult() {
    const blobWriter = new zip.BlobWriter("application/zip");
    const zipWriter = new zip.ZipWriter(blobWriter);

    for (const renderImage of renderImages) {
        await zipWriter.add(`Babylon.js/${renderImage.name}`, new zip.Data64URIReader(renderImage.base64Image));
    }

    await zipWriter.close();

    const blob = await blobWriter.getData();

    download(blob, "certification.zip");
}
