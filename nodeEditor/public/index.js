var snippetUrl = "https://snippet.babylonjs.com";
var currentSnippetToken;
var previousHash = "";
var nodeMaterial;

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

            try {
                var xmlHttp = new XMLHttpRequest();
                xmlHttp.onreadystatechange = function () {
                    if (xmlHttp.readyState == 4) {
                        if (xmlHttp.status == 200) {
                            var snippet = JSON.parse(JSON.parse(xmlHttp.responseText).jsonPayload);

                            if (editorDisplayed) {
                                customLoadObservable.notifyObservers(snippet.nodeMaterial);
                            } else {
                                nodeMaterial.loadFromSerialization(snippet.nodeMaterial);
                                nodeMaterial.build(true);
                                showEditor();
                            }
                        }
                    }
                }

                var hash = location.hash.substr(1);
                currentSnippetToken = hash.split("#")[0];
                xmlHttp.open("GET", snippetUrl + "/" + hash.replace("#", "/"));
                xmlHttp.send();
            } catch (e) {

            }
        }
    }

    setTimeout(checkHash, 200);
}

var showEditor = function() {
    editorDisplayed = true;
    var hostElement = document.getElementById("host-element");

    BABYLON.NodeEditor.Show({
        nodeMaterial: nodeMaterial, 
        hostElement: hostElement,
        customLoadObservable: customLoadObservable,
        customSave: {
            label: "Save as unique URL",
            action: (data) => {
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
                        }
                        else {
                            console.log("Unable to save your code. Please retry.", null);
                        }
                    }
                }
    
                xmlHttp.open("POST", snippetUrl + (currentSnippetToken ? "/" + currentSnippetToken : ""), true);
                xmlHttp.setRequestHeader("Content-Type", "application/json");
    
                var dataToSend = {
                    payload : JSON.stringify({
                        nodeMaterial: data
                    }),
                    name: "",
                    description: "",
                    tags: ""
                };
    
                xmlHttp.send(JSON.stringify(dataToSend));
            }
        }
    });
}

// Let's start
if (BABYLON.Engine.isSupported()) {
    var canvas = document.createElement("canvas");
    var engine = new BABYLON.Engine(canvas, false);
    var scene = new BABYLON.Scene(engine);

    nodeMaterial = new BABYLON.NodeMaterial("node");

    // Set to default
    if (!location.hash) {
        nodeMaterial.setToDefault();
        nodeMaterial.build(true);
        showEditor();
    }

}
else {
    alert('Babylon.js is not supported.')
}

checkHash();