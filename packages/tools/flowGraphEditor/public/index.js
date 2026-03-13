/* global BABYLON */

const fallbackUrl = "https://snapshots-cvgtc2eugrd3cgfd.z01.azurefd.net/refs/heads/master";

let loadScriptAsync = function (url, instantResolve) {
    return new Promise((resolve) => {
        let urlToLoad = typeof globalThis !== "undefined" && globalThis.__babylonSnapshotTimestamp__ ? url + "?t=" + globalThis.__babylonSnapshotTimestamp__ : url;
        const script = document.createElement("script");
        script.src = urlToLoad;
        script.onload = () => {
            if (!instantResolve) {
                resolve();
            }
        };
        script.onerror = () => {
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
        "https://preview.babylonjs.com/gui/babylon.gui.min.js",
        "https://preview.babylonjs.com/loaders/babylonjs.loaders.min.js",
    ],
    local: [
        `//${window.location.hostname}:1337/babylon.js`,
        `//${window.location.hostname}:1337/gui/babylon.gui.min.js`,
        `//${window.location.hostname}:1337/loaders/babylonjs.loaders.min.js`,
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

    let snapshot = "";
    if (window.location.search.indexOf("snapshot=") !== -1) {
        snapshot = window.location.search.split("=")[1];
        snapshot = snapshot.split("&")[0];
        activeVersion = "dist";
    }

    let version = "";
    if (window.location.search.indexOf("version=") !== -1) {
        version = window.location.search.split("version=")[1];
        version = version.split("&")[0];
        activeVersion = "dist";
    }

    let frameworkScripts = Versions[activeVersion] || Versions["dist"];
    if (snapshot) {
        frameworkScripts = frameworkScripts.map((v) => v.replace("https://preview.babylonjs.com", "https://snapshots-cvgtc2eugrd3cgfd.z01.azurefd.net/" + snapshot));
    } else if (version) {
        frameworkScripts = frameworkScripts.map((v) => v.replace("https://preview.babylonjs.com", "https://cdn.babylonjs.com/v" + version));
    }

    return new Promise((resolve) => {
        loadInSequence(frameworkScripts, 0, resolve);
    }).then(() => {
        if (snapshot) {
            globalThis.BABYLON.Tools.ScriptBaseUrl = "https://snapshots-cvgtc2eugrd3cgfd.z01.azurefd.net/" + snapshot;
        } else if (version) {
            globalThis.BABYLON.Tools.ScriptBaseUrl = "https://cdn.babylonjs.com/v" + version;
        } else if (activeVersion === "local") {
            globalThis.BABYLON.Tools.ScriptBaseUrl = window.location.protocol + `//${window.location.hostname}:1337/`;
        }
    });
};

checkBabylonVersionAsync().then(() => {
    loadScriptAsync("babylon.flowGraphEditor.js").then(() => {
        let startAsync = async function () {
            // Create a basic scene to test with
            const canvas = document.createElement("canvas");
            canvas.width = 1;
            canvas.height = 1;
            document.body.appendChild(canvas);

            const engine = new BABYLON.Engine(canvas, false);
            const scene = new BABYLON.Scene(engine);
            const coordinator = new BABYLON.FlowGraphCoordinator({ scene });
            const graph = coordinator.createGraph();

            const hostElement = document.getElementById("host-element");
            BABYLON.FlowGraphEditor.Show({
                flowGraph: graph,
                hostScene: scene,
                hostElement: hostElement,
            });
        };

        startAsync();
    });
});
