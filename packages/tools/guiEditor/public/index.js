var snippetUrl = "https://snippet.babylonjs.com";
var currentSnippetToken;
var previousHash = "";

let loadScriptAsync = function (url, instantResolve) {
    return new Promise((resolve, reject) => {
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

    return new Promise((resolve, reject) => {
        loadInSequence(Versions[activeVersion], 0, resolve);
    });
};

checkBabylonVersionAsync().then(() => {
    loadScriptAsync("babylon.guiEditor.js").then(() => {
        var customLoadObservable = new BABYLON.Observable();
        var editorDisplayed = false;

        var cleanHash = function () {
            var splits = decodeURIComponent(location.hash.substr(1)).split("#");

            if (splits.length > 2) {
                splits.splice(2, splits.length - 2);
            }

            location.hash = splits.join("#");
        };

        var checkHash = function () {
            if (location.hash) {
                if (previousHash != location.hash) {
                    cleanHash();

                    previousHash = location.hash;
                    var hash = location.hash.substr(1);
                    currentSnippetToken = hash;
                    showEditor();
                }
            }

            setTimeout(checkHash, 200);
        };

        var showEditor = function () {
            editorDisplayed = true;
            var hostElement = document.getElementById("host-element");

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
                                        var baseUrl = location.href.replace(location.hash, "").replace(location.search, "");
                                        var newUrl = baseUrl + "#" + snippet.id;
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
                            var baseUrl = location.href.replace(location.hash, "").replace(location.search, "");
                            var newUrl = baseUrl + "#" + data;
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
            var canvas = document.createElement("canvas");
            var engine = new BABYLON.Engine(canvas, false);
            var scene = new BABYLON.Scene(engine);

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
