/* global BABYLON */

var hostElement = document.getElementById("host-element");

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

const Versions = {
    dist: [
        "https://cdn.babylonjs.com/timestamp.js?t=" + Date.now(),
        "https://preview.babylonjs.com/babylon.js",
        "https://preview.babylonjs.com/loaders/babylonjs.loaders.min.js",
        "https://preview.babylonjs.com/serializers/babylonjs.serializers.min.js",
        "https://preview.babylonjs.com/materialsLibrary/babylonjs.materials.min.js",
        "https://preview.babylonjs.com/gui/babylon.gui.min.js",
        "https://preview.babylonjs.com/inspector/babylon.inspector.bundle.js",
    ],
    local: [
        `//${window.location.hostname}:1337/babylon.js`,
        `//${window.location.hostname}:1337/loaders/babylonjs.loaders.min.js`,
        `//${window.location.hostname}:1337/serializers/babylonjs.serializers.min.js`,
        `//${window.location.hostname}:1337/materialsLibrary/babylonjs.materials.min.js`,
        `//${window.location.hostname}:1337/gui/babylon.gui.min.js`,
        `//${window.location.hostname}:1337/inspector/babylon.inspector.bundle.js`,
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

    if (window.location.hostname === "localhost" && window.location.search.indexOf("dist") === -1) {
        activeVersion = "local";
    }

    let snapshot = "";
    // see if a snapshot should be used
    if (window.location.search.indexOf("snapshot=") !== -1) {
        snapshot = window.location.search.split("snapshot=")[1];
        // cleanup, just in case
        snapshot = snapshot.split("&")[0];
        activeVersion = "dist";
    }

    let version = "";
    if (window.location.search.indexOf("version=") !== -1) {
        version = window.location.search.split("version=")[1];
        // cleanup, just in case
        version = version.split("&")[0];
        activeVersion = "dist";
    }

    let versions = Versions[activeVersion] || Versions["dist"];
    if (snapshot && activeVersion === "dist") {
        versions = versions.map((v) => v.replace("https://preview.babylonjs.com", "https://babylonsnapshots.z22.web.core.windows.net/" + snapshot));
    } else if (version && activeVersion === "dist") {
        versions = versions.map((v) => v.replace("https://preview.babylonjs.com", "https://cdn.babylonjs.com/v" + version));
    }

    return new Promise((resolve, _reject) => {
        loadInSequence(versions, 0, resolve);
    });
};

checkBabylonVersionAsync().then(() => {
    loadScriptAsync("babylon.sandbox.js").then(() => {
        BABYLON.Sandbox.Show(hostElement);
    });
});
