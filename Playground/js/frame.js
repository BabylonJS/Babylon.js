var engine = null;
var canvas = null;
var scene = null;

fastEval = function (code) {
    var head = document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
    script.setAttribute('type', 'text/javascript');

    script.innerHTML = `try {${code};}
    catch(e) {
        handleException(e);
    }`;

    head.appendChild(script);
}

handleException = function (e) {
    console.error(e);
}

run = function () {
    var snippetUrl = "https://snippet.babylonjs.com";
    var fpsLabel = document.getElementById("fpsLabel");
    var refreshAnchor = document.getElementById("refresh");
    var editAnchor = document.getElementById("edit");

    var createEngineFunction = "createDefaultEngine";
    var createSceneFunction;

    if (location.href.toLowerCase().indexOf("noui") > -1) {
        fpsLabel.style.visibility = "hidden";
        fpsLabel.style.display = "none";
        refreshAnchor.style.visibility = "hidden";
        refreshAnchor.style.display = "none";
        editAnchor.style.visibility = "hidden";
        editAnchor.style.display = "none";
    }

    BABYLON.Engine.ShadersRepository = "/src/Shaders/";

    compileAndRun = function (code) {
        try {

            if (!BABYLON.Engine.isSupported()) {
                showError("Your browser does not support WebGL");
                return;
            }

            if (engine) {
                engine.dispose();
                engine = null;
            }

            canvas = document.getElementById("renderCanvas");

            createDefaultEngine = function () {
                return new BABYLON.Engine(canvas, true, {
                    preserveDrawingBuffer: true,
                    stencil: true
                });
            }

            if (code.indexOf("createEngine") !== -1) {
                createEngineFunction = "createEngine";
            }

            // Check for different typos
            if (code.indexOf("delayCreateScene") !== -1) { // delayCreateScene
                createSceneFunction = "delayCreateScene";
                checkCamera = false;
            } else if (code.indexOf("createScene") !== -1) { // createScene
                createSceneFunction = "createScene";
            } else if (code.indexOf("CreateScene") !== -1) { // CreateScene
                createSceneFunction = "CreateScene";
            } else if (code.indexOf("createscene") !== -1) { // createscene
                createSceneFunction = "createscene";
            }

            if (!createSceneFunction) {
                // Just pasted code.
                engine = createDefaultEngine();
                scene = new BABYLON.Scene(engine);
                var runScript = null;
                fastEval("runScript = function(scene, canvas) {" + code + "}");
                runScript(scene, canvas);
            } else {
                code += "\n engine = " + createEngineFunction + "();";
                code += "\n if (!engine) throw 'engine should not be null.';";
                code += "\n" + "scene = " + createSceneFunction + "();";

                // Execute the code
                fastEval(code);

                if (!engine) {
                    console.error("createEngine function must return an engine.");
                    return;
                }

                if (!scene) {
                    console.error(createSceneFunction + " function must return a scene.");
                    return;
                }
            }

            engine = engine;
            engine.runRenderLoop(function () {
                if (engine.scenes.length === 0) {
                    return;
                }

                if (canvas.width !== canvas.clientWidth) {
                    engine.resize();
                }

                var scene = engine.scenes[0];

                if (scene.activeCamera || scene.activeCameras.length > 0) {
                    scene.render();
                }
                if (fpsLabel && !(scene.activeCamera && 
                    scene.activeCamera.getClassName && 
                    scene.activeCamera.getClassName() === 'WebXRCamera')) {
                    fpsLabel.innerHTML = engine.getFps().toFixed() + " fps";
                }
            }.bind(this));

        } catch (e) {
            // showError(e.message);
        }
    };
    window.addEventListener("resize", function () {
        if (engine) {
            engine.resize();
        }
    });

    // UI
    var cleanHash = function () {
        var splits = decodeURIComponent(location.hash.substr(1)).split("#");

        if (splits.length > 2) {
            splits.splice(2, splits.length - 2);
        }

        location.hash = splits.join("#");
    };

    var checkHash = function () {
        if (location.hash) {
            cleanHash();

            try {
                var xmlHttp = new XMLHttpRequest();
                xmlHttp.onreadystatechange = function () {
                    if (xmlHttp.readyState === 4) {
                        if (xmlHttp.status === 200) {
                            var snippet = JSON.parse(xmlHttp.responseText);
                            var snippetCode = JSON.parse(snippet.jsonPayload).code;
                            compileAndRun(snippetCode);

                            var refresh = document.getElementById("refresh");

                            if (snippet.name != null && snippet.name != "") {
                                this.currentSnippetTitle = snippet.name;
                            } else this.currentSnippetTitle = null;
    
                            if (snippet.description != null && snippet.description != "") {
                                this.currentSnippetDescription = snippet.description;
                            } else this.currentSnippetDescription = null;
    
                            if (snippet.tags != null && snippet.tags != "") {
                                this.currentSnippetTags = snippet.tags;
                            } else this.currentSnippetTags = null;

                            updateMetadata.call(this);

                            if (refresh) {
                                refresh.addEventListener("click", function () {
                                    compileAndRun(snippetCode);
                                });
                            }
                        }
                    }
                };

                var hash = location.hash.substr(1);
                currentSnippetToken = hash.split("#")[0];
                if (!hash.split("#")[1]) hash += "#0";

                xmlHttp.open("GET", snippetUrl + "/" + hash.replace("#", "/"));
                xmlHttp.send();

                var edit = document.getElementById("edit");

                if (edit) {
                    edit.href = "//www.babylonjs-playground.com/#" + hash;
                }
            } catch (e) {

            }
        }
    };

    var updateMetadata = function() {
        var selection;

        if (this.currentSnippetTitle) {
            selection = document.querySelector('title');
            if (selection) {
                selection.innerText = (this.currentSnippetTitle + " | Babylon.js Playground");
            }
        }

        if (this.currentSnippetDescription) {
            selection = document.querySelector('meta[name="description"]');
            if (selection) {
                selection.setAttribute("content", this.currentSnippetDescription + " - Babylon.js Playground");
            }
        }

        if (this.currentSnippetTags) {
            selection = document.querySelector('meta[name="keywords"]');
            if (selection) {
                selection.setAttribute("content", "babylon.js, game engine, webgl, 3d," + this.currentSnippetTags);
            }
        }
    }

    checkHash();

}

run();