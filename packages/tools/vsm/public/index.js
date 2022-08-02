/* global BABYLON */
let snippetUrl = "https://snippet.babylonjs.com";
let currentSnippetToken;
let previousHash = "";

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
    dist: ["https://preview.babylonjs.com/timestamp.js?t=" + Date.now(), "https://preview.babylonjs.com/babylon.js", "https://preview.babylonjs.com/gui/babylon.gui.min.js"],
    local: ["//localhost:1337/babylon.js", "//localhost:1337/gui/babylon.gui.min.js"],
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
    // see if a snapshot should be used
    if (window.location.search.indexOf("snapshot=") !== -1) {
        snapshot = window.location.search.split("=")[1];
        // cleanup, just in case
        snapshot = snapshot.split("&")[0];
        activeVersion = "dist";
    }

    let versions = Versions[activeVersion] || Versions["dist"];
    if (snapshot && activeVersion === "dist") {
        versions = versions.map((v) => v.replace("https://preview.babylonjs.com", "https://babylonsnapshots.z22.web.core.windows.net/" + snapshot));
    }

    return new Promise((resolve) => {
        loadInSequence(versions, 0, resolve);
    });
};

checkBabylonVersionAsync().then(() => {
    loadScriptAsync("babylon.vsm.js").then(() => {
        let customLoadObservable = new BABYLON.Observable();
        let editorDisplayed = false;

        let cleanHash = function () {
            let splits = decodeURIComponent(location.hash.substr(1)).split("#");

            if (splits.length > 2) {
                splits.splice(2, splits.length - 2);
            }

            location.hash = splits.join("#");
        };

        let checkHash = function () {
            if (location.hash) {
                if (previousHash != location.hash) {
                    cleanHash();

                    previousHash = location.hash;
                    let hash = location.hash.substr(1);
                    currentSnippetToken = hash;
                    showEditor();
                }
            }

            setTimeout(checkHash, 200);
        };

        let showEditor = function () {
            editorDisplayed = true;
            let hostElement = document.getElementById("host-element");

            BABYLON.VSM.Show({
                hostElement: hostElement,
            });
        };

        // Let's start
        if (BABYLON.Engine.isSupported()) {
            let canvas = document.createElement("canvas");
            let engine = new BABYLON.Engine(canvas, false);
            let scene = new BABYLON.Scene(engine);

            // Set to default
            if (!location.hash) {
                showEditor();
            }
        } else {
            alert("Babylon.js is not supported.");
        }

        checkHash();
    });
});
