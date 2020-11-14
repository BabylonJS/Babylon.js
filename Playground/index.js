// Version 
var Versions = {
    "Latest": [
        "https://preview.babylonjs.com/babylon.js",
        "https://preview.babylonjs.com/gui/babylon.gui.min.js",
        "https://preview.babylonjs.com/inspector/babylon.inspector.bundle.js",
        "https://preview.babylonjs.com/nodeEditor/babylon.nodeEditor.js",
        "https://preview.babylonjs.com/materialsLibrary/babylonjs.materials.min.js",
        "https://preview.babylonjs.com/proceduralTexturesLibrary/babylonjs.proceduralTextures.min.js",
        "https://preview.babylonjs.com/postProcessesLibrary/babylonjs.postProcess.min.js",
        "https://preview.babylonjs.com/loaders/babylonjs.loaders.min.js",
        "https://preview.babylonjs.com/serializers/babylonjs.serializers.min.js"
    ],    
    "4.2.0": [
        "https://cdn.jsdelivr.net/gh/BabylonJS/Babylon.js@4.2.0/dist/babylon.js",
        "https://cdn.jsdelivr.net/gh/BabylonJS/Babylon.js@4.2.0/dist/gui/babylon.gui.min.js",
        "https://cdn.jsdelivr.net/gh/BabylonJS/Babylon.js@4.2.0/dist/inspector/babylon.inspector.bundle.js",
        "https://cdn.jsdelivr.net/gh/BabylonJS/Babylon.js@4.2.0/dist/materialsLibrary/babylonjs.materials.min.js",
        "https://cdn.jsdelivr.net/gh/BabylonJS/Babylon.js@4.2.0/dist/proceduralTexturesLibrary/babylonjs.proceduralTextures.min.js",
        "https://cdn.jsdelivr.net/gh/BabylonJS/Babylon.js@4.2.0/dist/postProcessesLibrary/babylonjs.postProcess.min.js",
        "https://cdn.jsdelivr.net/gh/BabylonJS/Babylon.js@4.2.0/dist/loaders/babylonjs.loaders.min.js",
        "https://cdn.jsdelivr.net/gh/BabylonJS/Babylon.js@4.2.0/dist/serializers/babylonjs.serializers.min.js"
    ],
    "4.1.0": [
        "https://cdn.jsdelivr.net/gh/BabylonJS/Babylon.js@4.1.0/dist/babylon.js",
        "https://cdn.jsdelivr.net/gh/BabylonJS/Babylon.js@4.1.0/dist/gui/babylon.gui.min.js",
        "https://cdn.jsdelivr.net/gh/BabylonJS/Babylon.js@4.1.0/dist/inspector/babylon.inspector.bundle.js",
        "https://cdn.jsdelivr.net/gh/BabylonJS/Babylon.js@4.1.0/dist/materialsLibrary/babylonjs.materials.min.js",
        "https://cdn.jsdelivr.net/gh/BabylonJS/Babylon.js@4.1.0/dist/proceduralTexturesLibrary/babylonjs.proceduralTextures.min.js",
        "https://cdn.jsdelivr.net/gh/BabylonJS/Babylon.js@4.1.0/dist/postProcessesLibrary/babylonjs.postProcess.min.js",
        "https://cdn.jsdelivr.net/gh/BabylonJS/Babylon.js@4.1.0/dist/loaders/babylonjs.loaders.min.js",
        "https://cdn.jsdelivr.net/gh/BabylonJS/Babylon.js@4.1.0/dist/serializers/babylonjs.serializers.min.js"
    ],
    "4.0.3": [
        "https://cdn.jsdelivr.net/gh/BabylonJS/Babylon.js@4.0.3/dist/babylon.js",
        "https://cdn.jsdelivr.net/gh/BabylonJS/Babylon.js@4.0.3/dist/gui/babylon.gui.min.js",
        "https://cdn.jsdelivr.net/gh/BabylonJS/Babylon.js@4.0.3/dist/inspector/babylon.inspector.bundle.js",
        "https://cdn.jsdelivr.net/gh/BabylonJS/Babylon.js@4.0.3/dist/materialsLibrary/babylonjs.materials.min.js",
        "https://cdn.jsdelivr.net/gh/BabylonJS/Babylon.js@4.0.3/dist/proceduralTexturesLibrary/babylonjs.proceduralTextures.min.js",
        "https://cdn.jsdelivr.net/gh/BabylonJS/Babylon.js@4.0.3/dist/postProcessesLibrary/babylonjs.postProcess.min.js",
        "https://cdn.jsdelivr.net/gh/BabylonJS/Babylon.js@4.0.3/dist/loaders/babylonjs.loaders.min.js",
        "https://cdn.jsdelivr.net/gh/BabylonJS/Babylon.js@4.0.3/dist/serializers/babylonjs.serializers.min.js"
    ],
    "3.3": [
        "https://cdn.jsdelivr.net/gh/BabylonJS/Babylon.js@3.3.0/dist/babylon.js",
        "https://cdn.jsdelivr.net/gh/BabylonJS/Babylon.js@3.3.0/dist/gui/babylon.gui.min.js",
        "https://cdn.jsdelivr.net/gh/BabylonJS/Babylon.js@3.3.0/dist/inspector/babylon.inspector.bundle.js",
        "https://cdn.jsdelivr.net/gh/BabylonJS/Babylon.js@3.3.0/dist/materialsLibrary/babylonjs.materials.min.js",
        "https://cdn.jsdelivr.net/gh/BabylonJS/Babylon.js@3.3.0/dist/proceduralTexturesLibrary/babylonjs.proceduralTextures.min.js",
        "https://cdn.jsdelivr.net/gh/BabylonJS/Babylon.js@3.3.0/dist/postProcessesLibrary/babylonjs.postProcess.min.js",
        "https://cdn.jsdelivr.net/gh/BabylonJS/Babylon.js@3.3.0/dist/loaders/babylonjs.loaders.min.js",
        "https://cdn.jsdelivr.net/gh/BabylonJS/Babylon.js@3.3.0/dist/serializers/babylonjs.serializers.min.js"
    ]
};

let loadScriptAsync = function(url) {
    return new Promise((resolve, reject) => {
        let script = document.createElement('script');
        script.src = url;
        script.onload = () => {
            resolve();
        }
        document.head.appendChild(script);
    });
}

let readStringFromStore = function(key, defaultValue) {
    if (localStorage.getItem(key) === null) {
        return defaultValue;
    }

    return localStorage.getItem(key);
}

let loadInSequence = async function(versions, index, resolve) {
    if (index >= versions.length) {
        resolve();
        return;
    }
    await loadScriptAsync(versions[index]);
    loadInSequence(versions, index + 1, resolve);
}

let checkBabylonVersionAsync= function () {
    let activeVersion = readStringFromStore("version", "Latest");

    if (activeVersion === "Latest") {
        return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
        loadInSequence(Versions[activeVersion], 0, resolve);
    });
}

var storedPGObbject = BABYLON.Playground;

checkBabylonVersionAsync().then(() => {
    if (typeof BABYLONDEVTOOLS !== 'undefined') {
        var hostElement = document.getElementById("host-element");
        storedPGObbject.Show(hostElement);
        return;
    }

    loadScriptAsync("/dist/babylon.playground.js").then(() => {
        var hostElement = document.getElementById("host-element");
        BABYLON.Playground.Show(hostElement);
    });
});
