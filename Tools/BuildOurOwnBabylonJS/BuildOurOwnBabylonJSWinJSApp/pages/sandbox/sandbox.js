var engine;
 (function () {
    "use strict";

    WinJS.UI.Pages.define("/pages/sandbox/sandbox.html", {
        // This function is called whenever a user navigates to this page. It
        // populates the page elements with the app's data.
        ready: function (element, options) {
            var canvas = element.querySelector("#babylonCanvas");
            engine = new BABYLON.Engine(canvas);

            var htmlInput = element.querySelector("#fileInput");

            var loading = new OURBABYLON.Loading(canvas.parentElement);

            var filesInput = new BABYLON.FilesInput(engine, null, canvas, function (sceneFile, scene) {
                if (!scene.activeCamera) {
                    scene.activeCamera = new BABYLON.ArcRotateCamera("DefaultCamera", -Math.PI / 2, Math.PI / 2, 10, new BABYLON.Vector3.Zero(), scene);
                    scene.activeCamera.zoomOn();
                    scene.activeCamera.attachControl(canvas);
                }
                if (scene.lights.length == 0) {
                    var light = new BABYLON.HemisphericLight("Default light", new BABYLON.Vector3(0, 1, 0), scene);
                }

                loading.hide();

            }, $.proxy(loading.onProgress, loading), null, null, $.proxy(loading.show, loading));

            htmlInput.addEventListener("change", filesInput.loadFiles, false);

            var navBar = document.body.querySelector("#navbar").winControl;
            navBar.show();
        },
        unload: function () {
            engine.stopRenderLoop();
            engine.dispose();
            engine = null;
        }
    });
})();
