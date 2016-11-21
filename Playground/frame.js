(function () {
    var snippetUrl = "http://babylonjs-api.azurewebsites.net/api/snippet";
    var currentSnippetToken;
    var engine;
    var fpsLabel = document.getElementById("fpsLabel");
    var scripts;
    var zipCode;
    BABYLON.Engine.ShadersRepository = "/src/Shaders/";
    var loadScript = function (scriptURL, title) {
        var xhr = new XMLHttpRequest();

        xhr.open('GET', scriptURL, true);

        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    blockEditorChange = true;
                    jsEditor.setValue(xhr.responseText);
                    jsEditor.setPosition({ lineNumber: 0, column: 0 });
                    blockEditorChange = false;
                    compileAndRun();

                    document.getElementById("currentScript").innerHTML = title;

                    currentSnippetToken = null;
                }
            }
        };

        xhr.send(null);
    };

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

            var canvas = document.getElementById("renderCanvas");
            engine = new BABYLON.Engine(canvas, true);
            engine.renderEvenInBackground = false;
            BABYLON.Camera.ForceAttachControlToAlwaysPreventDefault = true;

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

                fpsLabel.innerHTML = engine.getFps().toFixed() + " fps";
            });

            var scene;
            if (code.indexOf("createScene") !== -1) { // createScene
                eval(code);
                scene = createScene();
                if (!scene) {
                    showError("createScene function must return a scene.");
                    return;
                }

                zipCode = code + "\r\n\r\nvar scene = createScene();";
            } else if (code.indexOf("CreateScene") !== -1) { // CreateScene
                eval(code);
                scene = CreateScene();
                if (!scene) {
                    showError("CreateScene function must return a scene.");
                    return;
                }

                zipCode = code + "\r\n\r\nvar scene = CreateScene();";
            } else if (code.indexOf("createscene") !== -1) { // createscene
                eval(code);
                scene = createscene();
                if (!scene) {
                    showError("createscene function must return a scene.");
                    return;
                }

                zipCode = code + "\r\n\r\nvar scene = createscene();";
            } else { // Direct code
                scene = new BABYLON.Scene(engine);
                eval("runScript = function(scene, canvas) {" + code + "}");
                runScript(scene, canvas);

                zipCode = "var scene = new BABYLON.Scene(engine);\r\n\r\n" + code;
            }

        } catch (e) {
            showError(e.message);
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
    }

    var checkHash = function () {
        if (location.hash) {
            cleanHash();

            try {
                var xmlHttp = new XMLHttpRequest();
                xmlHttp.onreadystatechange = function () {
                    if (xmlHttp.readyState === 4) {
                        if (xmlHttp.status === 200) {
                            var snippet = JSON.parse(xmlHttp.responseText);
                            compileAndRun(snippet.code.toString());

                            document.getElementById("refresh").addEventListener("click", function () {
                                compileAndRun(snippet.code.toString());
                            });
                        }
                    }
                }

                var hash = location.hash.substr(1);
                currentSnippetToken = hash.split("#")[0];

                xmlHttp.open("GET", snippetUrl + "/" + hash.replace("#", "/"));
                xmlHttp.send();

                document.getElementById("link").href = "http://www.babylonjs-playground.com/#" + hash;
            } catch (e) {

            }
        }
    }

    checkHash();

})();