/* global BABYLON */
let snippetUrl = "https://snippet.babylonjs.com";
let currentSnippetToken;
let previousHash = "";

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

const Versions = {
    dist: ["https://preview.babylonjs.com/babylon.js", "https://preview.babylonjs.com/gui/babylon.gui.min.js"],
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
    loadScriptAsync("babylon.guiEditor.js").then(() => {
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

            BABYLON.GuiEditor.Show({
                hostElement: hostElement,
                customLoadObservable: customLoadObservable,
                currentSnippetToken: currentSnippetToken,
                customSave: {
                    label: "Save as unique URL",
                    action: (data) => {
                        return new Promise((resolve, reject) => {
                            const xmlHttp = new XMLHttpRequest();
                            xmlHttp.onreadystatechange = () => {
                                if (xmlHttp.readyState == 4) {
                                    if (xmlHttp.status == 200) {
                                        const snippet = JSON.parse(xmlHttp.responseText);
                                        let baseUrl = location.href.replace(location.hash, "").replace(location.search, "");
                                        let newUrl = baseUrl + "#" + snippet.id;
                                        currentSnippetToken = snippet.id;
                                        if (snippet.version && snippet.version != "0") {
                                            newUrl += "#" + snippet.version;
                                            currentSnippetToken += "#" + snippet.version;
                                        }
                                        location.href = newUrl;
                                        resolve(currentSnippetToken);
                                    } else {
                                        reject("Unable to save your GUI");
                                    }
                                }
                            };
                            xmlHttp.open("POST", snippetUrl + (currentSnippetToken ? "/" + currentSnippetToken : ""), true);
                            xmlHttp.setRequestHeader("Content-Type", "application/json");
                            const dataToSend = {
                                payload: JSON.stringify({
                                    gui: data,
                                }),
                                name: "",
                                description: "",
                                tags: "",
                            };
                            xmlHttp.send(JSON.stringify(dataToSend));
                        });
                    },
                },
                customLoad: {
                    label: "Load as unique URL",
                    action: (data) => {
                        return new Promise((resolve, reject) => {
                            let baseUrl = location.href.replace(location.hash, "").replace(location.search, "");
                            let newUrl = baseUrl + "#" + data;
                            currentSnippetToken = data;
                            location.href = newUrl;
                            resolve();
                        });
                    },
                },
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
