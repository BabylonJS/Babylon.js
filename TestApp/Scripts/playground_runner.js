if (typeof createScene === "function") {
    var engine = new BABYLON.NativeEngine();
    var scene = createScene();
    engine.runRenderLoop(function () {
        scene.render();
    });
}