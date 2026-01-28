/* global BABYLON */

var hostElement = document.getElementById("host-element");

const fallbackUrl = "https://snapshots-cvgtc2eugrd3cgfd.z01.azurefd.net/refs/heads/master";

// Register service worker for PWA
if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js");
}

let loadScriptAsync = function (url, instantResolve) {
    return new Promise((resolve) => {
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

const Versions = {
    dist: [
        { url: "https://cdn.babylonjs.com/timestamp.js?t=" + Date.now(), instantResolve: false },
        { url: "https://preview.babylonjs.com/babylon.js", instantResolve: false },
        { url: "https://preview.babylonjs.com/addons/babylonjs.addons.min.js", instantResolve: false, minVersion: "7.32.4" },
        { url: "https://preview.babylonjs.com/loaders/babylonjs.loaders.min.js", instantResolve: false },
        { url: "https://preview.babylonjs.com/serializers/babylonjs.serializers.min.js", instantResolve: true },
        { url: "https://preview.babylonjs.com/materialsLibrary/babylonjs.materials.min.js", instantResolve: true },
        { url: "https://preview.babylonjs.com/gui/babylon.gui.min.js", instantResolve: true },
        // Allow an "inspectorv1" query param to force loading Inspector v1.
        ...(window.location.search.toLocaleLowerCase().includes("inspectorv1")
            ? [{ url: "https://preview.babylonjs.com/inspector/babylon.inspector.bundle.js", instantResolve: true }]
            : [
                  { url: "https://preview.babylonjs.com/inspector/babylon.inspector.bundle.js", instantResolve: true, maxVersion: "8.40.0" },
                  { url: "https://preview.babylonjs.com/inspector/babylon.inspector-v2.bundle.js", instantResolve: true, minVersion: "8.40.1" },
              ]),
    ],
    local: [
        { url: `//${window.location.hostname}:1337/babylon.js`, instantResolve: false },
        { url: `//${window.location.hostname}:1337/addons/babylonjs.addons.js`, instantResolve: false },
        { url: `//${window.location.hostname}:1337/loaders/babylonjs.loaders.min.js`, instantResolve: false },
        { url: `//${window.location.hostname}:1337/serializers/babylonjs.serializers.min.js`, instantResolve: false },
        { url: `//${window.location.hostname}:1337/materialsLibrary/babylonjs.materials.min.js`, instantResolve: false },
        { url: `//${window.location.hostname}:1337/gui/babylon.gui.min.js`, instantResolve: false },
        // { url: `//${window.location.hostname}:1337/inspector/babylon.inspector.bundle.js`, instantResolve: false },
        { url: `//${window.location.hostname}:1337/inspector/babylon.inspector-v2.bundle.js`, instantResolve: false },
    ],
};

let loadInSequence = async function (versions, index, resolve) {
    if (index >= versions.length) {
        resolve();
        return;
    }

    await loadScriptAsync(versions[index].url, versions[index].instantResolve);

    loadInSequence(versions, index + 1, resolve);
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

let checkBabylonVersionAsync = function () {
    let activeVersion = "dist";

    // Check if running as installed PWA (standalone mode)
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;

    // Use local only when on localhost, not in standalone PWA mode, and ?dist not specified
    if (window.location.hostname === "localhost" && window.location.search.indexOf("dist") === -1 && !isStandalone) {
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
        versions = versions.map((v) => ({
            url: v.url.replace("https://preview.babylonjs.com", "https://snapshots-cvgtc2eugrd3cgfd.z01.azurefd.net/" + snapshot),
            instantResolve: v.instantResolve,
        }));
    } else if (version && activeVersion === "dist") {
        versions = versions
            .filter((v) => (!v.minVersion || isVersionGreaterOrEqual(version, v.minVersion)) && (!v.maxVersion || isVersionGreaterOrEqual(v.maxVersion, version)))
            .map((v) => ({
                url: v.url.replace("https://preview.babylonjs.com", "https://cdn.babylonjs.com/v" + version),
                instantResolve: v.instantResolve,
            }));
    }

    return new Promise((resolve, _reject) => {
        loadInSequence(versions, 0, resolve);
    }).then(() => {
        // if local, set the default base URL
        if (snapshot) {
            globalThis.BABYLON.Tools.ScriptBaseUrl = "https://snapshots-cvgtc2eugrd3cgfd.z01.azurefd.net/" + snapshot;
        } else if (version) {
            globalThis.BABYLON.Tools.ScriptBaseUrl = "https://cdn.babylonjs.com/v" + version;
        } else if (activeVersion === "local") {
            globalThis.BABYLON.Tools.ScriptBaseUrl = window.location.protocol + `//${window.location.hostname}:1337/`;
        }

        return { version, bundles: versions.map((v) => v.url) };
    });
};

checkBabylonVersionAsync().then((versionInfo) => {
    loadScriptAsync("babylon.sandbox.js").then(() => {
        BABYLON.Sandbox.Show(hostElement, versionInfo);
    });
});
