/* eslint-disable @typescript-eslint/naming-convention */
// Version
var Versions = {
    Latest: [
        "https://preview.babylonjs.com/babylon.js",
        "https://preview.babylonjs.com/gui/babylon.gui.min.js",
        "https://preview.babylonjs.com/inspector/babylon.inspector.bundle.js",
        "https://preview.babylonjs.com/nodeEditor/babylon.nodeEditor.js",
        "https://preview.babylonjs.com/guiEditor/babylon.guiEditor.js",
        "https://preview.babylonjs.com/materialsLibrary/babylonjs.materials.min.js",
        "https://preview.babylonjs.com/proceduralTexturesLibrary/babylonjs.proceduralTextures.min.js",
        "https://preview.babylonjs.com/postProcessesLibrary/babylonjs.postProcess.min.js",
        "https://preview.babylonjs.com/loaders/babylonjs.loaders.min.js",
        "https://preview.babylonjs.com/serializers/babylonjs.serializers.min.js",
        "https://rawcdn.githack.com/BabylonJS/Extensions/f43ab677b4bca0a6ab77132d3f785be300382760/ClonerSystem/src/babylonx.cloner.js",
        "https://rawcdn.githack.com/BabylonJS/Extensions/785013ec55b210d12263c91f3f0a2ae70cf0bc8a/CompoundShader/src/babylonx.CompoundShader.js",
    ],
    "4.2.0": [
        "https://cdn.jsdelivr.net/gh/BabylonJS/Babylon.js@4.2.0/dist/babylon.js",
        "https://cdn.jsdelivr.net/gh/BabylonJS/Babylon.js@4.2.0/dist/gui/babylon.gui.min.js",
        "https://cdn.jsdelivr.net/gh/BabylonJS/Babylon.js@4.2.0/dist/inspector/babylon.inspector.bundle.js",
        "https://cdn.jsdelivr.net/gh/BabylonJS/Babylon.js@4.2.0/dist/nodeEditor/babylon.nodeEditor.js",
        "https://cdn.jsdelivr.net/gh/BabylonJS/Babylon.js@4.2.0/dist/materialsLibrary/babylonjs.materials.min.js",
        "https://cdn.jsdelivr.net/gh/BabylonJS/Babylon.js@4.2.0/dist/proceduralTexturesLibrary/babylonjs.proceduralTextures.min.js",
        "https://cdn.jsdelivr.net/gh/BabylonJS/Babylon.js@4.2.0/dist/postProcessesLibrary/babylonjs.postProcess.min.js",
        "https://cdn.jsdelivr.net/gh/BabylonJS/Babylon.js@4.2.0/dist/loaders/babylonjs.loaders.min.js",
        "https://cdn.jsdelivr.net/gh/BabylonJS/Babylon.js@4.2.0/dist/serializers/babylonjs.serializers.min.js",
    ],
    "4.1.0": [
        "https://cdn.jsdelivr.net/gh/BabylonJS/Babylon.js@4.1.0/dist/babylon.js",
        "https://cdn.jsdelivr.net/gh/BabylonJS/Babylon.js@4.1.0/dist/gui/babylon.gui.min.js",
        "https://cdn.jsdelivr.net/gh/BabylonJS/Babylon.js@4.1.0/dist/inspector/babylon.inspector.bundle.js",
        "https://cdn.jsdelivr.net/gh/BabylonJS/Babylon.js@4.1.0/dist/materialsLibrary/babylonjs.materials.min.js",
        "https://cdn.jsdelivr.net/gh/BabylonJS/Babylon.js@4.1.0/dist/proceduralTexturesLibrary/babylonjs.proceduralTextures.min.js",
        "https://cdn.jsdelivr.net/gh/BabylonJS/Babylon.js@4.1.0/dist/postProcessesLibrary/babylonjs.postProcess.min.js",
        "https://cdn.jsdelivr.net/gh/BabylonJS/Babylon.js@4.1.0/dist/loaders/babylonjs.loaders.min.js",
        "https://cdn.jsdelivr.net/gh/BabylonJS/Babylon.js@4.1.0/dist/serializers/babylonjs.serializers.min.js",
    ],
    "4.0.3": [
        "https://cdn.jsdelivr.net/gh/BabylonJS/Babylon.js@4.0.3/dist/babylon.js",
        "https://cdn.jsdelivr.net/gh/BabylonJS/Babylon.js@4.0.3/dist/gui/babylon.gui.min.js",
        "https://cdn.jsdelivr.net/gh/BabylonJS/Babylon.js@4.0.3/dist/inspector/babylon.inspector.bundle.js",
        "https://cdn.jsdelivr.net/gh/BabylonJS/Babylon.js@4.0.3/dist/materialsLibrary/babylonjs.materials.min.js",
        "https://cdn.jsdelivr.net/gh/BabylonJS/Babylon.js@4.0.3/dist/proceduralTexturesLibrary/babylonjs.proceduralTextures.min.js",
        "https://cdn.jsdelivr.net/gh/BabylonJS/Babylon.js@4.0.3/dist/postProcessesLibrary/babylonjs.postProcess.min.js",
        "https://cdn.jsdelivr.net/gh/BabylonJS/Babylon.js@4.0.3/dist/loaders/babylonjs.loaders.min.js",
        "https://cdn.jsdelivr.net/gh/BabylonJS/Babylon.js@4.0.3/dist/serializers/babylonjs.serializers.min.js",
    ],
    3.3: [
        "https://cdn.jsdelivr.net/gh/BabylonJS/Babylon.js@3.3.0/dist/babylon.js",
        "https://cdn.jsdelivr.net/gh/BabylonJS/Babylon.js@3.3.0/dist/gui/babylon.gui.min.js",
        "https://cdn.jsdelivr.net/gh/BabylonJS/Babylon.js@3.3.0/dist/inspector/babylon.inspector.bundle.js",
        "https://cdn.jsdelivr.net/gh/BabylonJS/Babylon.js@3.3.0/dist/materialsLibrary/babylonjs.materials.min.js",
        "https://cdn.jsdelivr.net/gh/BabylonJS/Babylon.js@3.3.0/dist/proceduralTexturesLibrary/babylonjs.proceduralTextures.min.js",
        "https://cdn.jsdelivr.net/gh/BabylonJS/Babylon.js@3.3.0/dist/postProcessesLibrary/babylonjs.postProcess.min.js",
        "https://cdn.jsdelivr.net/gh/BabylonJS/Babylon.js@3.3.0/dist/loaders/babylonjs.loaders.min.js",
        "https://cdn.jsdelivr.net/gh/BabylonJS/Babylon.js@3.3.0/dist/serializers/babylonjs.serializers.min.js",
    ],
};

let loadScriptAsync = function (url, instantResolve) {
    return new Promise((resolve) => {
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

let readStringFromStore = function (key, defaultValue) {
    if (localStorage.getItem(key) === null) {
        return defaultValue;
    }

    return localStorage.getItem(key);
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
    let activeVersion = readStringFromStore("version", "Latest");

    if ((window.location.hostname === "localhost" && window.location.search.indexOf("dist") === -1) || window.location.search.indexOf("local") !== -1) {
        activeVersion = "local";
    }

    let snapshot = "";
    // see if a snapshot should be used
    if (window.location.search.indexOf("snapshot=") !== -1) {
        snapshot = window.location.search.split("=")[1];
        // cleanup, just in case
        snapshot = snapshot.split("&")[0];
        activeVersion = "Latest";
    }

    let versions = Versions[activeVersion] || Versions["Latest"];
    if(snapshot) {
        versions = versions.map(v => v.replace("https://preview.babylonjs.com", "https://babylonsnapshots.z22.web.core.windows.net/" + snapshot));
    }

    return new Promise((resolve) => {
        loadInSequence(versions, 0, resolve);
    });
};

checkBabylonVersionAsync().then(() => {
    loadScriptAsync("babylon.playground.js").then(() => {
        var hostElement = document.getElementById("host-element");
        let mode = undefined;
        if(window.location.href.includes("full.html")) {
            mode = 1;
        } else if(window.location.href.includes("frame.html")) {
            mode = 2;
        }
        // eslint-disable-next-line no-undef
        BABYLON.Playground.Show(hostElement, mode);
    });
});
