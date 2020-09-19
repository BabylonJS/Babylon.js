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
                                reject(`Unable to save your node material. It may be too large (${(dataToSend.payload.length / 1024).toFixed(2)} KB) because of embedded textures. Please reduce texture sizes or point to a specific url instead of embedding them and try again.`);
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
                });
            }
        }
    });
}

// Let's start
if (BABYLON.Engine.isSupported()) {
    var canvas = document.createElement("canvas");
    var engine = new BABYLON.Engine(canvas, false, {disableWebGL2Support: true});
    var scene = new BABYLON.Scene(engine);    
    var light0 = new BABYLON.HemisphericLight("light #0", new BABYLON.Vector3(0, 1, 0), scene);
    var light1 = new BABYLON.HemisphericLight("light #1", new BABYLON.Vector3(0, 1, 0), scene);
    var light2 = new BABYLON.HemisphericLight("light #2", new BABYLON.Vector3(0, 1, 0), scene);

    nodeMaterial = new BABYLON.NodeMaterial("node");

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
            case BABYLON.NodeMaterialModes.Particle:
                nodeMaterial.setToDefaultParticle();
                break;                
            case BABYLON.NodeMaterialModes.ProceduralTexture:
                nodeMaterial.setToDefaultProceduralTexture();
                break;
        }
        nodeMaterial.build(true);
        showEditor();
    }

}
else {
    alert('Babylon.js is not supported.')
}

checkHash();