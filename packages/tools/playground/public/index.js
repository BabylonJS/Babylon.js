/* eslint-disable @typescript-eslint/naming-convention */
// Version
var Versions = {
    Latest: [
        "https://cdn.babylonjs.com/timestamp.js?t=" + Date.now(),
        "https://preview.babylonjs.com/babylon.js",
        "https://preview.babylonjs.com/gui/babylon.gui.min.js",
        "https://preview.babylonjs.com/inspector/babylon.inspector.bundle.js",
        "https://preview.babylonjs.com/nodeEditor/babylon.nodeEditor.js",
        "https://preview.babylonjs.com/nodeGeometryEditor/babylon.nodeGeometryEditor.js",
        "https://preview.babylonjs.com/guiEditor/babylon.guiEditor.js",
        "https://preview.babylonjs.com/materialsLibrary/babylonjs.materials.min.js",
        "https://preview.babylonjs.com/proceduralTexturesLibrary/babylonjs.proceduralTextures.min.js",
        "https://preview.babylonjs.com/postProcessesLibrary/babylonjs.postProcess.min.js",
        "https://preview.babylonjs.com/loaders/babylonjs.loaders.min.js",
        "https://preview.babylonjs.com/serializers/babylonjs.serializers.min.js",
        "https://preview.babylonjs.com/accessibility/babylon.accessibility.js",
        "https://rawcdn.githack.com/BabylonJS/Extensions/f43ab677b4bca0a6ab77132d3f785be300382760/ClonerSystem/src/babylonx.cloner.js",
        "https://rawcdn.githack.com/BabylonJS/Extensions/785013ec55b210d12263c91f3f0a2ae70cf0bc8a/CompoundShader/src/babylonx.CompoundShader.js",
    ],
    local: [
        `//${window.location.hostname}:1337/babylon.js`,
        `//${window.location.hostname}:1337/gui/babylon.gui.min.js`,
        `//${window.location.hostname}:1337/inspector/babylon.inspector.bundle.js`,
        `//${window.location.hostname}:1337/nodeEditor/babylon.nodeEditor.js`,
        `//${window.location.hostname}:1337/nodeGeometryEditor/babylon.nodeGeometryEditor.js`,
        `//${window.location.hostname}:1337/guiEditor/babylon.guiEditor.js`,
        `//${window.location.hostname}:1337/materialsLibrary/babylonjs.materials.min.js`,
        `//${window.location.hostname}:1337/proceduralTexturesLibrary/babylonjs.proceduralTextures.min.js`,
        `//${window.location.hostname}:1337/postProcessesLibrary/babylonjs.postProcess.min.js`,
        `//${window.location.hostname}:1337/loaders/babylonjs.loaders.min.js`,
        `//${window.location.hostname}:1337/serializers/babylonjs.serializers.min.js`,
        `//${window.location.hostname}:1337/accessibility/babylon.accessibility.js`,
        "https://rawcdn.githack.com/BabylonJS/Extensions/f43ab677b4bca0a6ab77132d3f785be300382760/ClonerSystem/src/babylonx.cloner.js",
        "https://rawcdn.githack.com/BabylonJS/Extensions/785013ec55b210d12263c91f3f0a2ae70cf0bc8a/CompoundShader/src/babylonx.CompoundShader.js",
    ],
    "5.71.1": [
        "https://cdn.babylonjs.com/timestamp.js?t=" + Date.now(),
        "https://cdn.babylonjs.com/v5.71.1/babylon.js",
        "https://cdn.babylonjs.com/v5.57.1/gui/babylon.gui.min.js",
        "https://cdn.babylonjs.com/v5.57.1/inspector/babylon.inspector.bundle.js",
        "https://cdn.babylonjs.com/v5.57.1/nodeEditor/babylon.nodeEditor.js",
        "https://cdn.babylonjs.com/v5.57.1/nodeGeometryEditor/babylon.nodeGeometryEditor.js",
        "https://cdn.babylonjs.com/v5.57.1/guiEditor/babylon.guiEditor.js",
        "https://cdn.babylonjs.com/v5.57.1/materialsLibrary/babylonjs.materials.min.js",
        "https://cdn.babylonjs.com/v5.57.1/proceduralTexturesLibrary/babylonjs.proceduralTextures.min.js",
        "https://cdn.babylonjs.com/v5.57.1/postProcessesLibrary/babylonjs.postProcess.min.js",
        "https://cdn.babylonjs.com/v5.57.1/loaders/babylonjs.loaders.min.js",
        "https://cdn.babylonjs.com/v5.57.1/serializers/babylonjs.serializers.min.js",
        "https://cdn.babylonjs.com/v5.57.1/accessibility/babylon.accessibility.js",
        "https://rawcdn.githack.com/BabylonJS/Extensions/f43ab677b4bca0a6ab77132d3f785be300382760/ClonerSystem/src/babylonx.cloner.js",
        "https://rawcdn.githack.com/BabylonJS/Extensions/785013ec55b210d12263c91f3f0a2ae70cf0bc8a/CompoundShader/src/babylonx.CompoundShader.js",
    ],
    "4.2.1": [
        "https://cdn.babylonjs.com/4.2.1/babylon.js",
        "https://cdn.babylonjs.com/4.2.1/gui/babylon.gui.min.js",
        "https://cdn.babylonjs.com/4.2.1/inspector/babylon.inspector.bundle.js",
        "https://cdn.babylonjs.com/4.2.1/nodeEditor/babylon.nodeEditor.js",
        "https://cdn.babylonjs.com/4.2.1/nodeGeometryEditor/babylon.nodeGeometryEditor.js",
        "https://cdn.babylonjs.com/4.2.1/materialsLibrary/babylonjs.materials.min.js",
        "https://cdn.babylonjs.com/4.2.1/proceduralTexturesLibrary/babylonjs.proceduralTextures.min.js",
        "https://cdn.babylonjs.com/4.2.1/postProcessesLibrary/babylonjs.postProcess.min.js",
        "https://cdn.babylonjs.com/4.2.1/loaders/babylonjs.loaders.min.js",
        "https://cdn.babylonjs.com/4.2.1/serializers/babylonjs.serializers.min.js",
    ],
    // TODO - add previous versions to the CDN
    // "4.1.0": [
    //     "https://cdn.jsdelivr.net/gh/BabylonJS/Babylon.js@4.1.0/dist/babylon.js",
    //     "https://cdn.jsdelivr.net/gh/BabylonJS/Babylon.js@4.1.0/dist/gui/babylon.gui.min.js",
    //     "https://cdn.jsdelivr.net/gh/BabylonJS/Babylon.js@4.1.0/dist/inspector/babylon.inspector.bundle.js",
    //     "https://cdn.jsdelivr.net/gh/BabylonJS/Babylon.js@4.1.0/dist/materialsLibrary/babylonjs.materials.min.js",
    //     "https://cdn.jsdelivr.net/gh/BabylonJS/Babylon.js@4.1.0/dist/proceduralTexturesLibrary/babylonjs.proceduralTextures.min.js",
    //     "https://cdn.jsdelivr.net/gh/BabylonJS/Babylon.js@4.1.0/dist/postProcessesLibrary/babylonjs.postProcess.min.js",
    //     "https://cdn.jsdelivr.net/gh/BabylonJS/Babylon.js@4.1.0/dist/loaders/babylonjs.loaders.min.js",
    //     "https://cdn.jsdelivr.net/gh/BabylonJS/Babylon.js@4.1.0/dist/serializers/babylonjs.serializers.min.js",
    // ],
    // "4.0.3": [
    //     "https://cdn.jsdelivr.net/gh/BabylonJS/Babylon.js@4.0.3/dist/babylon.js",
    //     "https://cdn.jsdelivr.net/gh/BabylonJS/Babylon.js@4.0.3/dist/gui/babylon.gui.min.js",
    //     "https://cdn.jsdelivr.net/gh/BabylonJS/Babylon.js@4.0.3/dist/inspector/babylon.inspector.bundle.js",
    //     "https://cdn.jsdelivr.net/gh/BabylonJS/Babylon.js@4.0.3/dist/materialsLibrary/babylonjs.materials.min.js",
    //     "https://cdn.jsdelivr.net/gh/BabylonJS/Babylon.js@4.0.3/dist/proceduralTexturesLibrary/babylonjs.proceduralTextures.min.js",
    //     "https://cdn.jsdelivr.net/gh/BabylonJS/Babylon.js@4.0.3/dist/postProcessesLibrary/babylonjs.postProcess.min.js",
    //     "https://cdn.jsdelivr.net/gh/BabylonJS/Babylon.js@4.0.3/dist/loaders/babylonjs.loaders.min.js",
    //     "https://cdn.jsdelivr.net/gh/BabylonJS/Babylon.js@4.0.3/dist/serializers/babylonjs.serializers.min.js",
    // ],
};

const fallbackUrl = "https://babylonsnapshots.z22.web.core.windows.net/refs/heads/master";

let loadScriptAsync = function (url, instantResolve) {
    return new Promise((resolve) => {
        // eslint-disable-next-line no-undef
        let urlToLoad = typeof globalThis !== "undefined" && globalThis.__babylonSnapshotTimestamp__ ? url + "?t=" + globalThis.__babylonSnapshotTimestamp__ : url;
        const script = document.createElement("script");
        script.src = urlToLoad;
        script.onload = () => {
            if (!instantResolve) {
                resolve();
            }
        };
        script.onerror = () => {
            // fallback
            const fallbackScript = document.createElement("script");
            fallbackScript.src = url.replace("https://preview.babylonjs.com", fallbackUrl);
            fallbackScript.onload = () => {
                if (!instantResolve) {
                    resolve();
                }
            };
            document.head.appendChild(fallbackScript);
        };
        document.head.appendChild(script);
        if (instantResolve) {
            resolve();
        }
    });
};

let readStringFromStore = function (key, defaultValue) {
    if (sessionStorage.getItem(key) === null) {
        return defaultValue;
    }

    return sessionStorage.getItem(key);
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
        // eslint-disable-next-line no-console
        console.log("Using local version. To use preview add ?dist=true to the url");
        activeVersion = "local";
    }

    let snapshot = "";
    // see if a snapshot should be used
    if (window.location.search.indexOf("snapshot=") !== -1) {
        snapshot = window.location.search.split("snapshot=")[1];
        // cleanup, just in case
        snapshot = snapshot.split("&")[0];
        activeVersion = "Latest";
    }

    let version = "";
    if (window.location.search.indexOf("version=") !== -1) {
        version = window.location.search.split("version=")[1];
        // cleanup, just in case
        version = version.split("&")[0];
        activeVersion = "Latest";
    }

    let frameworkScripts = Versions[activeVersion] || Versions["Latest"];
    if (snapshot) {
        frameworkScripts = frameworkScripts.map((v) => v.replace("https://preview.babylonjs.com", "https://babylonsnapshots.z22.web.core.windows.net/" + snapshot));
    } else if(version) {
        frameworkScripts = frameworkScripts.map((v) => v.replace("https://preview.babylonjs.com", "https://cdn.babylonjs.com/v" + version));
    } else if (window.location.href.includes("debug.html")) {
        frameworkScripts = frameworkScripts.map((v) => {
            if (!v.includes("https://preview.babylonjs.com") && !v.includes("https://cdn.jsdelivr.net/gh/BabylonJS/Babylon.js")) {
                return v;
            }
            if(v.includes("timestamp.js")) {
                return v;
            }
            if (v.includes(".min.")) {
                return v.replace(".min", "");
            } else {
                return v.replace("babylon.js", "babylon.max.js");
            }
        });
    }

    return new Promise((resolve) => {
        loadInSequence(frameworkScripts, 0, resolve);
    });
};

checkBabylonVersionAsync().then(() => {
    loadScriptAsync("babylon.playground.js").then(() => {
        var hostElement = document.getElementById("host-element");
        let mode = undefined;
        if (window.location.href.includes("full.html")) {
            mode = 1;
        } else if (window.location.href.includes("frame.html")) {
            mode = 2;
        }
        // eslint-disable-next-line no-undef
        BABYLON.Playground.Show(hostElement, mode);
    });
});
