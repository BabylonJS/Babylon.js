var engine;
(function () {
    "use strict";

    WinJS.UI.Pages.define("/pages/babylonScene/babylonScene.html", {
        // This function is called whenever a user navigates to this page. It
        // populates the page elements with the app's data.
        ready: function (element, options) {
            var canvas = element.querySelector("#babylonCanvas");
            engine = new BABYLON.Engine(canvas, true);

            var loading = new OURBABYLON.Loading(canvas.parentElement);

            loading.show();

            BABYLON.SceneLoader.Load(options.babylonFolder + "/", options.babylonFile, engine, function (scene) {
                scene.executeWhenReady(function () { 
                    if (!scene.activeCamera) {
                        scene.activeCamera = new BABYLON.ArcRotateCamera("DefaultCamera", -Math.PI / 2, Math.PI / 2, 10, new BABYLON.Vector3.Zero(), scene);
                        scene.activeCamera.zoomOn();
                    }
                    if (scene.lights.length == 0) {
                        var light = new BABYLON.HemisphericLight("Default light", new BABYLON.Vector3(0, 1, 0), scene);
                    }
                    scene.activeCamera.attachControl(canvas);

                    engine.runRenderLoop(function () {
                        scene.render();
                    });

                    loading.hide();
                });
            }, $.proxy(loading.onProgress, loading));

        },
        unload: function () {
            engine.stopRenderLoop();
            engine.dispose();
            engine = null;
        }
    });
})();
