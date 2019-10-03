importScripts('../Tools/DevLoader/BabylonLoader.js');

// Global to simulate PG.
var engine = null;
var canvas = null;

onmessage = function(evt) {
    canvas = evt.data.canvas;
    
    // Load the scripts + map file to allow vscode debug.
    BABYLONDEVTOOLS.Loader
        .require("src/index.js")
        .load(function() {
            if (typeof createEngine !== "undefined") {
                engine = createEngine();
            } else {
                engine = new BABYLON.Engine(canvas, true, { premultipliedAlpha: false, stencil: true, disableWebGL2Support: false, preserveDrawingBuffer: true });
            }

            // call the scene creation from the js.
            if (typeof delayCreateScene !== "undefined") {
                var scene = delayCreateScene();

                if (scene) {
                    // Register a render loop to repeatedly render the scene

                    engine.runRenderLoop(function() {
                        if (scene.activeCamera) {
                            scene.render();
                        }
                    });
                }
            }
            else {
                var scene = createScene();

                if (scene) {

                    var processCurrentScene = function(scene) {
                        engine.runRenderLoop(function() {
                            scene.render();
                        });
                    }

                    if (scene.then) {
                        // Handle if createScene returns a promise
                        scene.then(function(currentScene) {
                            processCurrentScene(currentScene);
                        }).catch(function(e) {
                            console.error(e);
                            onError();
                        });
                    } else {
                        // Register a render loop to repeatedly render the scene
                        processCurrentScene(scene);
                    }
                }
            }
        });
    }