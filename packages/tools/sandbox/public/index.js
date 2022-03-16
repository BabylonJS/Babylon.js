/* global BABYLON */

var hostElement = document.getElementById("host-element");

let loadScriptAsync = function (url, instantResolve) {
    return new Promise((resolve, _reject) => {
        let script = document.createElement("script");
        script.src = url;
        script.onload = () => {
            if (!instantResolve) {
                resolve();
            }
        };
        document.head.appendChild(script);
        if (instantResolve) {
            resolve();
        }
    });
};

const Versions = {
    dist: [
        "https://preview.babylonjs.com/babylon.js",
        "https://preview.babylonjs.com/loaders/babylonjs.loaders.min.js",
        "https://preview.babylonjs.com/serializers/babylonjs.serializers.min.js",
        "https://preview.babylonjs.com/materialsLibrary/babylonjs.materials.min.js",
        "https://preview.babylonjs.com/gui/babylon.gui.min.js",
        "https://preview.babylonjs.com/inspector/babylon.inspector.bundle.js",
    ],
    local: [
        "//localhost:1337/babylon.js",
        "//localhost:1337/loaders/babylonjs.loaders.min.js",
        "//localhost:1337/serializers/babylonjs.serializers.min.js",
        "//localhost:1337/materialsLibrary/babylonjs.materials.min.js",
        "//localhost:1337/gui/babylon.gui.min.js",
        "//localhost:1337/inspector/babylon.inspector.bundle.js",
    ],
};

let loadInSequence = async function (versions, index, resolve) {
    if (index >= versions.length) {
        resolve();
        return;
    }
    await loadScriptAsync(versions[index], index > 2);
    loadInSequence(versions, index + 1, resolve);
};

let checkBabylonVersionAsync = function () {
    let activeVersion = "dist";

    if ((window.location.hostname === "localhost" && window.location.search.indexOf("dist") === -1) || window.location.search.indexOf("local") !== -1) {
        activeVersion = "local";
    }

    return new Promise((resolve, _reject) => {
        loadInSequence(Versions[activeVersion], 0, resolve);
    });
};

checkBabylonVersionAsync().then(() => {
    loadScriptAsync("babylon.sandbox.js").then(() => {
        BABYLON.Sandbox.Show(hostElement);
    });
});

/**
 *     <script src="https://preview.babylonjs.com/babylon.js"></script>

    <script src="https://preview.babylonjs.com/loaders/babylonjs.loaders.min.js"></script>
    <script src="https://preview.babylonjs.com/serializers/babylonjs.serializers.min.js"></script>
    <script src="https://preview.babylonjs.com/materialsLibrary/babylonjs.materials.min.js"></script>
    <script src="https://preview.babylonjs.com/gui/babylon.gui.min.js"></script>

    <script src="https://preview.babylonjs.com/inspector/babylon.inspector.bundle.js"></script>
    <script src="dist/babylon.sandbox.js"></script>
 */
