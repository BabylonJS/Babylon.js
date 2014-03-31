var engine;
(function () {
    "use strict";

    WinJS.UI.Pages.define("/pages/babylonScene/babylonScene.html", {
        // This function is called whenever a user navigates to this page. It
        // populates the page elements with the app's data.
        ready: function (element, options) {
            var canvas = element.querySelector("#babylonCanvas");
            engine = new BABYLON.Engine(canvas, true);

            BABYLON.SceneLoader.Load("/BabylonJs-Demos/"+options.babylonFolder + "/", options.babylonFile, engine, function (scene) {
                //scene = newScene;

                scene.executeWhenReady(function () { 
                    if (!scene.activeCamera) {
                        scene.activeCamera = new BABYLON.ArcRotateCamera("DefaultCamera", Math.PI / 2, 0, 10, new BABYLON.Vector3.Zero(), scene);
                        scene.activeCamera.zoomOn();
                        /*var cube = BABYLON.Mesh.CreateSphere("test", 10, 1, scene);
                        cube.material = new BABYLON.StandardMaterial("test", scene);
                        cube.material.emissiveColor = new BABYLON.Color3(1.0, 0.0, 0.0);
                        cube.position = scene.activeCamera.target;*/
                    }
                    if (scene.lights.length == 0) {
                        var light = new BABYLON.HemisphericLight("Default light", new BABYLON.Vector3(0, 1, 0), scene);
                    }
                    scene.activeCamera.attachControl(canvas);

                    engine.runRenderLoop(function () {
                        scene.render();
                    });
                });
            })
        },
        unload: function () {
            engine.stopRenderLoop();
            engine.dispose();
            engine = null;
        }
    });
})();
