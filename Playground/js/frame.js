import { utils } from "mocha";

// TO DO - Rewrite frame.js to work with the new class architecture.

(function() {
    var snippetUrl = "https://snippet.babylonjs.com";
    var currentSnippetToken;
    var engine;
    var fpsLabel = document.getElementById("fpsLabel");
    var refreshAnchor = document.getElementById("refresh");
    var editAnchor = document.getElementById("edit");
    var scripts;
    var zipCode;

    if (location.href.toLowerCase().indexOf("noui") > -1) {
        fpsLabel.style.visibility = "hidden";
        fpsLabel.style.display = "none";
        refreshAnchor.style.visibility = "hidden";
        refreshAnchor.style.display = "none";
        editAnchor.style.visibility = "hidden";
        editAnchor.style.display = "none";
    }

    BABYLON.Engine.ShadersRepository = "/src/Shaders/";
    var loadScript = function(scriptURL, title) {
        var xhr = new XMLHttpRequest();

        xhr.open('GET', scriptURL, true);

        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    monacoCreator.BlockEditorChange.lockEditorChange = true;
                    console.log(xhr.responseText);
                    jsEditor.setValue(xhr.responseText);
                    jsEditor.setPosition({ lineNumber: 0, column: 0 });
                    monacoCreator.BlockEditorChange = false;
                    compileAndRun();

                    document.getElementById("currentScript").innerHTML = title;

                    currentSnippetToken = null;
                }
            }
        };

        xhr.send(null);
    };

    var showError = function(error) {
        utils.showError(error, null);
    };

    compileAndRun = function(code) {
        try {

            if (!BABYLON.Engine.isSupported()) {
                showError("Your browser does not support WebGL");
                return;
            }

            if (engine) {
                engine.dispose();
                engine = null;
            }

            var canvas = document.getElementById("renderCanvas");

            var checkCamera = true;
            var wrappedEval = false;
            var createEngineFunction = "createDefaultEngine";
            var createSceneFunction;

            var createDefaultEngine = function() {
                return new BABYLON.Engine(canvas, true, { stencil: true });
            }

            var scene;

            if (code.indexOf("createEngine") !== -1) {
                createEngineFunction = "createEngine";
            }

            if (code.indexOf("delayCreateScene") !== -1) { // createScene
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
                // just pasted code.
                engine = createDefaultEngine();
                scene = new BABYLON.Scene(engine);
                eval("runScript = function(scene, canvas) {" + code + "}");
                runScript(scene, canvas);

                zipCode = "var scene = new BABYLON.Scene(engine);\r\n\r\n" + code;
            } else {
                //execute the code
                eval(code);
                //create engine
                eval("engine = " + createEngineFunction + "()");
                if (!engine) {
                    showError("createEngine function must return an engine.", null);
                    return;
                }

                //create scene
                eval("scene = " + createSceneFunction + "()");

                if (!scene) {
                    showError(createSceneFunction + " function must return a scene.", null);
                    return;
                }

                // update the scene code for the zip file
                zipCode = code + "\r\n\r\nvar scene = " + createSceneFunction + "()";
            }

            BABYLON.Camera.ForceAttachControlToAlwaysPreventDefault = true;
            engine.runRenderLoop(function() {
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

                if (fpsLabel) {
                    fpsLabel.innerHTML = engine.getFps().toFixed() + " fps";
                }
            });

        } catch (e) {
            // showError(e.message);
        }
    };
    window.addEventListener("resize", function() {
        if (engine) {
            engine.resize();
        }
    });

    // UI
    var cleanHash = function() {
        var splits = decodeURIComponent(location.hash.substr(1)).split("#");

        if (splits.length > 2) {
            splits.splice(2, splits.length - 2);
        }

        location.hash = splits.join("#");
    };

    var checkHash = function() {
        if (location.hash) {
            cleanHash();

            try {
                var xmlHttp = new XMLHttpRequest();
                xmlHttp.onreadystatechange = function() {
                    if (xmlHttp.readyState === 4) {
                        if (xmlHttp.status === 200) {
                            var snippetCode = JSON.parse(JSON.parse(xmlHttp.responseText).jsonPayload).code;
                            compileAndRun(snippetCode);

                            var refresh = document.getElementById("refresh");

                            if (refresh) {
                                refresh.addEventListener("click", function() {
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

    checkHash();

})();
