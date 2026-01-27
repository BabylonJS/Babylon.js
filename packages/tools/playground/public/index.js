/* eslint-disable @typescript-eslint/naming-convention */
// Version
var Versions = {
    Latest: [
        { url: "https://cdn.babylonjs.com/timestamp.js?t=" + Date.now(), instantResolve: false },
        { url: "https://preview.babylonjs.com/babylon.js", instantResolve: false },
        { url: "https://preview.babylonjs.com/gui/babylon.gui.min.js", instantResolve: false },
        { url: "https://preview.babylonjs.com/addons/babylonjs.addons.min.js", instantResolve: false, minVersion: "7.32.4" },
        // Allow an "inspectorv1" query param to force loading Inspector v1.
        ...(window.location.search.toLocaleLowerCase().includes("inspectorv1")
            ? [{ url: "https://preview.babylonjs.com/inspector/babylon.inspector.bundle.js", instantResolve: true }]
            : [
                  { url: "https://preview.babylonjs.com/inspector/babylon.inspector.bundle.js", instantResolve: true, maxVersion: "8.40.0" },
                  { url: "https://preview.babylonjs.com/inspector/babylon.inspector-v2.bundle.js", instantResolve: true, minVersion: "8.40.1" },
              ]),
        { url: "https://preview.babylonjs.com/nodeEditor/babylon.nodeEditor.js", instantResolve: true },
        { url: "https://preview.babylonjs.com/nodeGeometryEditor/babylon.nodeGeometryEditor.js", instantResolve: true },
        { url: "https://preview.babylonjs.com/nodeRenderGraphEditor/babylon.nodeRenderGraphEditor.js", instantResolve: true },
        { url: "https://preview.babylonjs.com/guiEditor/babylon.guiEditor.js", instantResolve: true },
        { url: "https://preview.babylonjs.com/materialsLibrary/babylonjs.materials.min.js", instantResolve: true },
        { url: "https://preview.babylonjs.com/proceduralTexturesLibrary/babylonjs.proceduralTextures.min.js", instantResolve: true },
        { url: "https://preview.babylonjs.com/postProcessesLibrary/babylonjs.postProcess.min.js", instantResolve: true },
        { url: "https://preview.babylonjs.com/loaders/babylonjs.loaders.min.js", instantResolve: true },
        { url: "https://preview.babylonjs.com/serializers/babylonjs.serializers.min.js", instantResolve: true },
        { url: "https://preview.babylonjs.com/accessibility/babylon.accessibility.js", instantResolve: true },
        { url: "https://rawcdn.githack.com/BabylonJS/Extensions/f43ab677b4bca0a6ab77132d3f785be300382760/ClonerSystem/src/babylonx.cloner.js", instantResolve: true },
        { url: "https://rawcdn.githack.com/BabylonJS/Extensions/785013ec55b210d12263c91f3f0a2ae70cf0bc8a/CompoundShader/src/babylonx.CompoundShader.js", instantResolve: true },
    ],
    local: [
        { url: `//${window.location.hostname}:1337/babylon.js`, instantResolve: false },
        { url: `//${window.location.hostname}:1337/gui/babylon.gui.min.js`, instantResolve: false },
        { url: `//${window.location.hostname}:1337/addons/babylonjs.addons.js`, instantResolve: false },
        { url: `//${window.location.hostname}:1337/inspector/babylon.inspector.bundle.js`, instantResolve: false },
        { url: `//${window.location.hostname}:1337/inspector/babylon.inspector-v2.bundle.js`, instantResolve: false },
        { url: `//${window.location.hostname}:1337/nodeEditor/babylon.nodeEditor.js`, instantResolve: false },
        { url: `//${window.location.hostname}:1337/nodeGeometryEditor/babylon.nodeGeometryEditor.js`, instantResolve: false },
        { url: `//${window.location.hostname}:1337/nodeRenderGraphEditor/babylon.nodeRenderGraphEditor.js`, instantResolve: false },
        { url: `//${window.location.hostname}:1337/guiEditor/babylon.guiEditor.js`, instantResolve: false },
        { url: `//${window.location.hostname}:1337/materialsLibrary/babylonjs.materials.min.js`, instantResolve: false },
        { url: `//${window.location.hostname}:1337/proceduralTexturesLibrary/babylonjs.proceduralTextures.min.js`, instantResolve: false },
        { url: `//${window.location.hostname}:1337/postProcessesLibrary/babylonjs.postProcess.min.js`, instantResolve: false },
        { url: `//${window.location.hostname}:1337/loaders/babylonjs.loaders.min.js`, instantResolve: false },
        { url: `//${window.location.hostname}:1337/serializers/babylonjs.serializers.min.js`, instantResolve: false },
        { url: `//${window.location.hostname}:1337/accessibility/babylon.accessibility.js`, instantResolve: false },
        { url: "https://rawcdn.githack.com/BabylonJS/Extensions/f43ab677b4bca0a6ab77132d3f785be300382760/ClonerSystem/src/babylonx.cloner.js", instantResolve: false },
        { url: "https://rawcdn.githack.com/BabylonJS/Extensions/785013ec55b210d12263c91f3f0a2ae70cf0bc8a/CompoundShader/src/babylonx.CompoundShader.js", instantResolve: false },
    ],
    "7.54.2": [
        { url: "https://cdn.babylonjs.com/timestamp.js?t=" + Date.now(), instantResolve: false },
        { url: "https://cdn.babylonjs.com/v7.54.2/babylon.js", instantResolve: false },
        { url: "https://cdn.babylonjs.com/v7.54.2/addons/babylonjs.addons.js", instantResolve: false },
        { url: "https://cdn.babylonjs.com/v7.54.2/gui/babylon.gui.min.js", instantResolve: false },
        { url: "https://cdn.babylonjs.com/v7.54.2/inspector/babylon.inspector.bundle.js", instantResolve: true },
        { url: "https://cdn.babylonjs.com/v7.54.2/nodeEditor/babylon.nodeEditor.js", instantResolve: true },
        { url: "https://cdn.babylonjs.com/v7.54.2/nodeGeometryEditor/babylon.nodeGeometryEditor.js", instantResolve: true },
        { url: "https://cdn.babylonjs.com/v7.54.2/nodeRenderGraphEditor/babylon.nodeRenderGraphEditor.js", instantResolve: true },
        { url: "https://cdn.babylonjs.com/v7.54.2/guiEditor/babylon.guiEditor.js", instantResolve: true },
        { url: "https://cdn.babylonjs.com/v7.54.2/materialsLibrary/babylonjs.materials.min.js", instantResolve: true },
        { url: "https://cdn.babylonjs.com/v7.54.2/proceduralTexturesLibrary/babylonjs.proceduralTextures.min.js", instantResolve: true },
        { url: "https://cdn.babylonjs.com/v7.54.2/postProcessesLibrary/babylonjs.postProcess.min.js", instantResolve: true },
        { url: "https://cdn.babylonjs.com/v7.54.2/loaders/babylonjs.loaders.min.js", instantResolve: true },
        { url: "https://cdn.babylonjs.com/v7.54.2/serializers/babylonjs.serializers.min.js", instantResolve: true },
        { url: "https://cdn.babylonjs.com/v7.54.2/accessibility/babylon.accessibility.js", instantResolve: true },
        { url: "https://rawcdn.githack.com/BabylonJS/Extensions/f43ab677b4bca0a6ab77132d3f785be300382760/ClonerSystem/src/babylonx.cloner.js", instantResolve: true },
        { url: "https://rawcdn.githack.com/BabylonJS/Extensions/785013ec55b210d12263c91f3f0a2ae70cf0bc8a/CompoundShader/src/babylonx.CompoundShader.js", instantResolve: true },
    ],
    "6.49.0": [
        { url: "https://cdn.babylonjs.com/timestamp.js?t=" + Date.now(), instantResolve: false },
        { url: "https://cdn.babylonjs.com/v6.49.0/babylon.js", instantResolve: false },
        { url: "https://cdn.babylonjs.com/v6.49.0/gui/babylon.gui.min.js", instantResolve: false },
        { url: "https://cdn.babylonjs.com/v6.49.0/inspector/babylon.inspector.bundle.js", instantResolve: true },
        { url: "https://cdn.babylonjs.com/v6.49.0/nodeEditor/babylon.nodeEditor.js", instantResolve: true },
        { url: "https://cdn.babylonjs.com/v6.49.0/nodeGeometryEditor/babylon.nodeGeometryEditor.js", instantResolve: true },
        { url: "https://cdn.babylonjs.com/v6.49.0/guiEditor/babylon.guiEditor.js", instantResolve: true },
        { url: "https://cdn.babylonjs.com/v6.49.0/materialsLibrary/babylonjs.materials.min.js", instantResolve: true },
        { url: "https://cdn.babylonjs.com/v6.49.0/proceduralTexturesLibrary/babylonjs.proceduralTextures.min.js", instantResolve: true },
        { url: "https://cdn.babylonjs.com/v6.49.0/postProcessesLibrary/babylonjs.postProcess.min.js", instantResolve: true },
        { url: "https://cdn.babylonjs.com/v6.49.0/loaders/babylonjs.loaders.min.js", instantResolve: true },
        { url: "https://cdn.babylonjs.com/v6.49.0/serializers/babylonjs.serializers.min.js", instantResolve: true },
        { url: "https://cdn.babylonjs.com/v6.49.0/accessibility/babylon.accessibility.js", instantResolve: true },
        { url: "https://rawcdn.githack.com/BabylonJS/Extensions/f43ab677b4bca0a6ab77132d3f785be300382760/ClonerSystem/src/babylonx.cloner.js", instantResolve: true },
        { url: "https://rawcdn.githack.com/BabylonJS/Extensions/785013ec55b210d12263c91f3f0a2ae70cf0bc8a/CompoundShader/src/babylonx.CompoundShader.js", instantResolve: true },
    ],
    "5.57.1": [
        { url: "https://cdn.babylonjs.com/timestamp.js?t=" + Date.now(), instantResolve: false },
        { url: "https://cdn.babylonjs.com/v5.57.1/babylon.js", instantResolve: false },
        { url: "https://cdn.babylonjs.com/v5.57.1/gui/babylon.gui.min.js", instantResolve: false },
        { url: "https://cdn.babylonjs.com/v5.57.1/inspector/babylon.inspector.bundle.js", instantResolve: true },
        { url: "https://cdn.babylonjs.com/v5.57.1/nodeEditor/babylon.nodeEditor.js", instantResolve: true },
        { url: "https://cdn.babylonjs.com/v5.57.1/nodeGeometryEditor/babylon.nodeGeometryEditor.js", instantResolve: true },
        { url: "https://cdn.babylonjs.com/v5.57.1/guiEditor/babylon.guiEditor.js", instantResolve: true },
        { url: "https://cdn.babylonjs.com/v5.57.1/materialsLibrary/babylonjs.materials.min.js", instantResolve: true },
        { url: "https://cdn.babylonjs.com/v5.57.1/proceduralTexturesLibrary/babylonjs.proceduralTextures.min.js", instantResolve: true },
        { url: "https://cdn.babylonjs.com/v5.57.1/postProcessesLibrary/babylonjs.postProcess.min.js", instantResolve: true },
        { url: "https://cdn.babylonjs.com/v5.57.1/loaders/babylonjs.loaders.min.js", instantResolve: true },
        { url: "https://cdn.babylonjs.com/v5.57.1/serializers/babylonjs.serializers.min.js", instantResolve: true },
        { url: "https://cdn.babylonjs.com/v5.57.1/accessibility/babylon.accessibility.js", instantResolve: true },
        { url: "https://rawcdn.githack.com/BabylonJS/Extensions/f43ab677b4bca0a6ab77132d3f785be300382760/ClonerSystem/src/babylonx.cloner.js", instantResolve: true },
        { url: "https://rawcdn.githack.com/BabylonJS/Extensions/785013ec55b210d12263c91f3f0a2ae70cf0bc8a/CompoundShader/src/babylonx.CompoundShader.js", instantResolve: true },
    ],
};

const fallbackUrl = "https://snapshots-cvgtc2eugrd3cgfd.z01.azurefd.net/refs/heads/master";

let loadScriptAsync = async function (url, instantResolve) {
    return new Promise((resolve) => {
        // eslint-disable-next-line no-undef
        let urlToLoad = typeof globalThis !== "undefined" && globalThis.__babylonSnapshotTimestamp__ ? url + "?t=" + globalThis.__babylonSnapshotTimestamp__ : url;
        const script = document.createElement("script");
        script.src = urlToLoad;
        // Scripts will still download in parallel, but will execute in the sequence they are added to the DOM
        script.async = false;
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

let loadInSequenceAsync = async function (versions, index, resolve) {
    if (index >= versions.length) {
        resolve();
        return;
    }
    await loadScriptAsync(versions[index].url, versions[index].instantResolve);
    loadInSequenceAsync(versions, index + 1, resolve);
};

const isVersionGreaterOrEqual = function (version1, version2) {
    // Split versions into parts and convert to numbers
    const v1Parts = version1.split(".").map(Number);
    const v2Parts = version2.split(".").map(Number);

    // Compare major, minor, and revision in order
    for (let i = 0; i < 3; i++) {
        const v1Part = v1Parts[i] ?? 0; // Default to 0 if part is missing
        const v2Part = v2Parts[i] ?? 0;

        if (v1Part > v2Part) {
            return true;
        }
        if (v1Part < v2Part) {
            return false;
        }
        // If equal, continue to next part
    }

    // All parts are equal
    return true;
};

let checkBabylonVersionAsync = async function () {
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
        frameworkScripts = frameworkScripts.map((v) => ({
            ...v,
            url: v.url.replace("https://preview.babylonjs.com", "https://snapshots-cvgtc2eugrd3cgfd.z01.azurefd.net/" + snapshot),
        }));
    } else if (version) {
        frameworkScripts = frameworkScripts
            .filter((v) => (!v.minVersion || isVersionGreaterOrEqual(version, v.minVersion)) && (!v.maxVersion || isVersionGreaterOrEqual(v.maxVersion, version)))
            .map((v) => ({ ...v, url: v.url.replace("https://preview.babylonjs.com", "https://cdn.babylonjs.com/v" + version) }));
    } else if (window.location.href.includes("debug.html")) {
        frameworkScripts = frameworkScripts.map((v) => {
            if (!v.url.includes("https://preview.babylonjs.com") && !v.url.includes("https://cdn.jsdelivr.net/gh/BabylonJS/Babylon.js")) {
                return v;
            }
            if (v.url.includes("timestamp.js")) {
                return v;
            }
            if (v.url.includes(".min.")) {
                return { ...v, url: v.url.replace(".min", "") };
            } else {
                return { ...v, url: v.url.replace("babylon.js", "babylon.max.js") };
            }
        });
    }

    return new Promise((resolve) => {
        loadInSequenceAsync(frameworkScripts, 0, resolve);
    }).then(() => {
        const bundles = frameworkScripts.map((v) => v.url);
        // if local, set the default base URL
        if (snapshot) {
            // eslint-disable-next-line no-undef
            globalThis.BABYLON.Tools.ScriptBaseUrl = "https://snapshots-cvgtc2eugrd3cgfd.z01.azurefd.net/" + snapshot;
            return { version: "", bundles };
        } else if (version) {
            // eslint-disable-next-line no-undef
            globalThis.BABYLON.Tools.ScriptBaseUrl = "https://cdn.babylonjs.com/v" + version;
            return { version, bundles };
        } else if (activeVersion === "local") {
            // eslint-disable-next-line no-undef
            globalThis.BABYLON.Tools.ScriptBaseUrl = window.location.protocol + `//${window.location.hostname}:1337/`;
            return { version: "", bundles };
        }

        return { version: activeVersion.includes(".") ? activeVersion : "", bundles };
    });
};

checkBabylonVersionAsync().then((versionInfo) => {
    const bundle = (globalThis && globalThis.__PLAYGROUND_BUNDLE__) || "babylon.playground.js";
    loadScriptAsync(bundle).then(() => {
        var hostElement = document.getElementById("host-element");
        let mode = undefined;
        if (window.location.href.includes("full.html")) {
            mode = 1;
        } else if (window.location.href.includes("frame.html")) {
            mode = 2;
        }
        // eslint-disable-next-line no-undef
        BABYLON.Playground.Show(hostElement, mode, versionInfo.version, versionInfo.bundles);
    });
});
