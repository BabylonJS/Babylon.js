var snippetUrl = "https://snippet.babylonjs.com";
var currentSnippetToken;
var previousHash = "";

var customLoadObservable = new BABYLON.Observable();
var editorDisplayed = false;

var cleanHash = function () {
    var splits = decodeURIComponent(location.hash.substr(1)).split("#");

    if (splits.length > 2) {
        splits.splice(2, splits.length - 2);
    }

    location.hash = splits.join("#");
}

var checkHash = function () {
    if (location.hash) {
        if (previousHash != location.hash) {
            cleanHash();

            previousHash = location.hash;
            var hash = location.hash.substr(1);
            currentSnippetToken = hash.split("#")[0];
            showEditor();
        }
    }

    setTimeout(checkHash, 200);
}

var showEditor = function() {
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
                    var xmlHttp = new XMLHttpRequest();
                    xmlHttp.onreadystatechange = function () {
                        if (xmlHttp.readyState == 4) {
                            if (xmlHttp.status == 200) {
                                var baseUrl = location.href.replace(location.hash, "").replace(location.search, "");
                                var snippet = JSON.parse(xmlHttp.responseText);
                                var newUrl = baseUrl + "#" + snippet.id;
                                currentSnippetToken = snippet.id;
                                if (snippet.version && snippet.version != "0") {
                                    newUrl += "#" + snippet.version;
                                }
                                location.href = newUrl;
                                resolve();
                            }
                            else {
                                reject(`Unable to save your gui layout. It may be too large (${(dataToSend.payload.length / 1024).toFixed(2)}`);
                            }
                        }
                    }
        
                    xmlHttp.open("POST", snippetUrl + (currentSnippetToken ? "/" + currentSnippetToken : ""), true);
                    xmlHttp.setRequestHeader("Content-Type", "application/json");
        
                    var dataToSend = {
                        payload : JSON.stringify({
                            guiLayout: data
                        }),
                        name: "",
                        description: "",
                        tags: ""
                    };
        
                    xmlHttp.send(JSON.stringify(dataToSend));
                });
            }
        }
    });
}

// Let's start
if (BABYLON.Engine.isSupported()) {
    var canvas = document.createElement("canvas");
    var engine = new BABYLON.Engine(canvas, false);
    var scene = new BABYLON.Scene(engine);

    // Set to default
    if (!location.hash) {
        showEditor();
    }
}
else {
    alert('Babylon.js is not supported.')
}

checkHash();