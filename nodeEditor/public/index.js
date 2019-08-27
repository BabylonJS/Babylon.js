var snippetUrl = "https://snippet.babylonjs.com";
var currentSnippetToken;
var previousHash = "";
var nodeMaterial;

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
                            nodeMaterial.loadFromSerialization(snippet.nodeMaterial);
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

// Let's start
if (BABYLON.Engine.isSupported()) {
    var canvas = document.createElement("canvas");
    var engine = new BABYLON.Engine(canvas, false);
    var scene = new BABYLON.Scene(engine);

    nodeMaterial = new BABYLON.NodeMaterial("node");
    nodeMaterial.setToDefault();
    nodeMaterial.build(true);

    var hostElement = document.getElementById("host-element");

    BABYLON.NodeEditor.Show({
        nodeMaterial: nodeMaterial, 
        hostElement: hostElement,
        customSave: {
            label: "Save as unique URL",
            callback: () => {
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
                        nodeMaterial: nodeMaterial.serialize() 
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
else {
    alert('Babylon.js is not supported.')
}

checkHash();