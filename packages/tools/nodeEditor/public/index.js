/* global BABYLON */
let snippetUrl = "https://snippet.babylonjs.com";
let currentSnippetToken;
let previousHash = "";
let nodeMaterial;

const fallbackUrl = "https://snapshots-cvgtc2eugrd3cgfd.z01.azurefd.net/refs/heads/master";

if (window.location.search.indexOf("webgpu") !== -1) {
    localStorage.setItem("Engine", 1);
}

let useWebGPU = localStorage.getItem("Engine") === "1";

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
    dist: ["https://cdn.babylonjs.com/timestamp.js?t=" + Date.now(), "https://preview.babylonjs.com/babylon.js", "https://preview.babylonjs.com/loaders/babylonjs.loaders.min.js"],
    local: [`//${window.location.hostname}:1337/babylon.js`, `//${window.location.hostname}:1337/loaders/babylonjs.loaders.min.js`],
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
            globalThis.BABYLON.Tools.ScriptBaseUrl = window.location.protocol + `//${window.location.hostname}:1337/`;
        }
    });
};

checkBabylonVersionAsync().then(() => {
    loadScriptAsync("babylon.nodeEditor.js").then(() => {
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

                    try {
                        let xmlHttp = new XMLHttpRequest();
                        xmlHttp.onreadystatechange = function () {
                            if (xmlHttp.readyState == 4) {
                                if (xmlHttp.status == 200) {
                                    let snippet = JSON.parse(JSON.parse(xmlHttp.responseText).jsonPayload);
                                    let serializationObject = JSON.parse(snippet.nodeMaterial);

                                    if (editorDisplayed) {
                                        customLoadObservable.notifyObservers(serializationObject);
                                    } else {
                                        nodeMaterial.loadFromSerialization(serializationObject);
                                        try {
                                            nodeMaterial.build(true);
                                        } catch (err) {
                                            // Swallow the error here
                                        }
                                        showEditor();
                                    }
                                }
                            }
                        };

                        let hash = location.hash.substr(1);
                        currentSnippetToken = hash.split("#")[0];
                        xmlHttp.open("GET", snippetUrl + "/" + hash.replace("#", "/"));
                        xmlHttp.send();
                    } catch (e) {}
                }
            }

            setTimeout(checkHash, 200);
        };

        let startAsync = async function () {
            // Let's start
            if (BABYLON.Engine.isSupported()) {
                let canvas = document.createElement("canvas");
                let engine;

                if (useWebGPU && (await BABYLON.WebGPUEngine.IsSupportedAsync)) {
                    engine = new BABYLON.WebGPUEngine(canvas);
                    await engine.initAsync();
                } else {
                    localStorage.setItem("Engine", 0);
                    useWebGPU = false;
                    engine = new BABYLON.Engine(canvas, false, { disableWebGL2Support: false });
                }

                let scene = new BABYLON.Scene(engine);
                new BABYLON.HemisphericLight("light #0", new BABYLON.Vector3(0, 1, 0), scene);
                new BABYLON.HemisphericLight("light #1", new BABYLON.Vector3(0, 1, 0), scene);
                new BABYLON.HemisphericLight("light #2", new BABYLON.Vector3(0, 1, 0), scene);

                nodeMaterial = new BABYLON.NodeMaterial("node", scene, {
                    shaderLanguage: useWebGPU ? BABYLON.ShaderLanguage.WGSL : BABYLON.ShaderLanguage.GLSL,
                });

                // Set to default
                if (!location.hash) {
                    const mode = BABYLON.DataStorage.ReadNumber("Mode", BABYLON.NodeMaterialModes.Material);

                    switch (mode) {
                        case BABYLON.NodeMaterialModes.Material:
                            nodeMaterial.setToDefault();
                            break;
                        case BABYLON.NodeMaterialModes.PostProcess:
                            nodeMaterial.setToDefaultPostProcess();
                            break;
                        case BABYLON.NodeMaterialModes.SFE:
                            BABYLON.SetToDefaultSFE(nodeMaterial);
                            break;
                        case BABYLON.NodeMaterialModes.Particle:
                            nodeMaterial.setToDefaultParticle();
                            break;
                        case BABYLON.NodeMaterialModes.ProceduralTexture:
                            nodeMaterial.setToDefaultProceduralTexture();
                            break;
                        case BABYLON.NodeMaterialModes.GaussianSplatting:
                            BABYLON.SetToDefaultGaussianSplatting(nodeMaterial);
                            break;
                    }
                    nodeMaterial.build(true);
                    showEditor();
                }
            } else {
                alert("Babylon.js is not supported.");
            }

            checkHash();
        };

        let showEditor = function () {
            editorDisplayed = true;
            let hostElement = document.getElementById("host-element");

            BABYLON.NodeEditor.Show({
                nodeMaterial: nodeMaterial,
                hostElement: hostElement,
                customLoadObservable: customLoadObservable,
                customSave: {
                    label: "Save as unique URL",
                    action: (data) => {
                        return new Promise((resolve, reject) => {
                            let xmlHttp = new XMLHttpRequest();
                            xmlHttp.onreadystatechange = function () {
                                if (xmlHttp.readyState == 4) {
                                    if (xmlHttp.status == 200) {
                                        let baseUrl = location.href.replace(location.hash, "").replace(location.search, "");
                                        let snippet = JSON.parse(xmlHttp.responseText);
                                        let newUrl = baseUrl + (useWebGPU ? "?webgpu" : "") + "#" + snippet.id;
                                        currentSnippetToken = snippet.id;
                                        if (snippet.version && snippet.version != "0") {
                                            newUrl += "#" + snippet.version;
                                        }
                                        location.href = newUrl;
                                        resolve();
                                    } else {
                                        reject(
                                            `Unable to save your node material. It may be too large (${(dataToSend.payload.length / 1024).toFixed(
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
                                    nodeMaterial: data,
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
        startAsync();
    });
});
