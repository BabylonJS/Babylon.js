/* eslint-disable no-console */
/* global BABYLON */
import { ParseDataSnippetResponse } from "@tools/snippet-loader/parseDataSnippetResponse";

var cdnPort = 1337;
let snippetUrl = "https://snippet.babylonjs.com";
let currentSnippetToken;
let previousHash = "";
let nodeGeometry;

const fallbackUrl = "https://snapshots-cvgtc2eugrd3cgfd.z01.azurefd.net/refs/heads/master";

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
        "https://preview.babylonjs.com/materialsLibrary/babylonjs.materials.min.js",
    ],
    local: [
        `//${window.location.hostname}:${cdnPort}/babylon.js`,
        `//${window.location.hostname}:${cdnPort}/loaders/babylonjs.loaders.min.js`,
        `//${window.location.hostname}:${cdnPort}/materialsLibrary/babylonjs.materials.min.js`,
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
    // see if a snapshot should be used
    if (window.location.search.indexOf("snapshot=") !== -1) {
        snapshot = window.location.search.split("=")[1];
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

    let frameworkScripts = Versions[activeVersion] || Versions["dist"];
    if (snapshot) {
        frameworkScripts = frameworkScripts.map((v) => v.replace("https://preview.babylonjs.com", "https://snapshots-cvgtc2eugrd3cgfd.z01.azurefd.net/" + snapshot));
    } else if (version) {
        frameworkScripts = frameworkScripts.map((v) => v.replace("https://preview.babylonjs.com", "https://cdn.babylonjs.com/v" + version));
    }

    return new Promise((resolve) => {
        loadInSequence(frameworkScripts, 0, resolve);
    }).then(() => {
        // if local, set the default base URL
        if (snapshot) {
            // eslint-disable-next-line no-undef
            globalThis.BABYLON.Tools.ScriptBaseUrl = "https://snapshots-cvgtc2eugrd3cgfd.z01.azurefd.net/" + snapshot;
        } else if (version) {
            // eslint-disable-next-line no-undef
            globalThis.BABYLON.Tools.ScriptBaseUrl = "https://cdn.babylonjs.com/v" + version;
        } else if (activeVersion === "local") {
            // eslint-disable-next-line no-undef
            globalThis.BABYLON.Tools.ScriptBaseUrl = window.location.protocol + `//${window.location.hostname}:${cdnPort}/`;
        }
    });
};

checkBabylonVersionAsync().then(() => {
    loadScriptAsync("babylon.nodeGeometryEditor.js").then(() => {
        let customLoadObservable = new BABYLON.Observable();
        let editorDisplayed = false;

        let cleanHash = function () {
            let splits = decodeURIComponent(location.hash.substr(1)).split("#");

            if (splits.length > 2) {
                splits.splice(2, splits.length - 2);
            }

            location.hash = splits.join("#");
        };

        let loadSnippetFromHashAsync = function () {
            cleanHash();
            previousHash = location.hash;

            return new Promise((resolve, reject) => {
                let hash = location.hash.substr(1);
                currentSnippetToken = hash.split("#")[0];

                let xmlHttp = new XMLHttpRequest();
                xmlHttp.onreadystatechange = function () {
                    if (xmlHttp.readyState == 4) {
                        if (xmlHttp.status == 200) {
                            try {
                                let snippet = ParseDataSnippetResponse(JSON.parse(xmlHttp.responseText), hash, "nodeGeometry");
                                resolve(snippet.data);
                            } catch (err) {
                                reject(err);
                            }
                        } else {
                            reject(new Error(`Unable to load node geometry snippet ${hash}`));
                        }
                    }
                };
                xmlHttp.onerror = function () {
                    reject(new Error(`Unable to load node geometry snippet ${hash}`));
                };
                xmlHttp.open("GET", snippetUrl + "/" + hash.replace("#", "/"));
                xmlHttp.send();
            });
        };

        let applySerializedGeometry = function (serializationObject) {
            nodeGeometry.parseSerializedObject(serializationObject);
            try {
                nodeGeometry.build(true);
            } catch (err) {
                console.error(err);
            }
        };

        let checkHash = function () {
            if (location.hash && previousHash != location.hash) {
                loadSnippetFromHashAsync()
                    .then((serializationObject) => {
                        customLoadObservable.notifyObservers(serializationObject);
                    })
                    .catch((err) => {
                        console.error(err);
                    });
            }

            setTimeout(checkHash, 200);
        };

        let showEditor = function () {
            editorDisplayed = true;
            let hostElement = document.getElementById("host-element");

            BABYLON.NodeGeometryEditor.Show({
                nodeGeometry: nodeGeometry,
                hostElement: hostElement,
                customLoadObservable: customLoadObservable,
                customSave: {
                    label: "Save as unique URL (*)",
                    action: (data) => {
                        return new Promise((resolve, reject) => {
                            let xmlHttp = new XMLHttpRequest();
                            xmlHttp.onreadystatechange = function () {
                                if (xmlHttp.readyState == 4) {
                                    if (xmlHttp.status == 200) {
                                        let baseUrl = location.href.replace(location.hash, "").replace(location.search, "");
                                        let snippet = JSON.parse(xmlHttp.responseText);
                                        let newUrl = baseUrl + "#" + snippet.id;
                                        currentSnippetToken = snippet.id;
                                        if (snippet.version && snippet.version != "0") {
                                            newUrl += "#" + snippet.version;
                                        }
                                        location.href = newUrl;
                                        resolve();
                                    } else {
                                        reject(
                                            `Unable to save your node geometry. It may be too large (${(dataToSend.payload.length / 1024).toFixed(
                                                2
                                            )} KB) because of embedded textures. Please reduce texture sizes or point to a specific url instead of embedding them and try again.`
                                        );
                                    }
                                }
                            };

                            xmlHttp.open("POST", snippetUrl + (currentSnippetToken ? "/" + currentSnippetToken : ""), true);
                            xmlHttp.setRequestHeader("Content-Type", "application/json");

                            let dataToSend = {
                                payload: JSON.stringify({
                                    nodeGeometry: data,
                                }),
                                name: "",
                                description: "",
                                tags: "",
                            };

                            xmlHttp.send(JSON.stringify(dataToSend));
                        });
                    },
                },
            });
        };
        // Let's start
        if (BABYLON.Engine.isSupported()) {
            let canvas = document.createElement("canvas");
            let engine = new BABYLON.Engine(canvas, false, { disableWebGL2Support: false });
            let scene = new BABYLON.Scene(engine);
            new BABYLON.HemisphericLight("light #0", new BABYLON.Vector3(0, 1, 0), scene);

            nodeGeometry = new BABYLON.NodeGeometry("node");
            if (location.hash) {
                loadSnippetFromHashAsync()
                    .then((serializationObject) => {
                        applySerializedGeometry(serializationObject);
                        showEditor();
                    })
                    .catch((err) => {
                        console.error(err);
                        nodeGeometry.setToDefault();
                        nodeGeometry.build();
                        showEditor();
                    });
            } else {
                nodeGeometry.setToDefault();
                nodeGeometry.build();
                showEditor();
            }
        } else {
            alert("Babylon.js is not supported.");
        }

        checkHash();
    });
});
