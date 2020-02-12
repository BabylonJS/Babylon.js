var engine = new BABYLON.NativeEngine();
var scene = new BABYLON.Scene(engine);

BABYLON.SceneLoader.AppendAsync("https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Sponza/glTF/Sponza.gltf").then(function () {
	var camera1 = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(3, 2, -6), scene);
	camera1.setTarget(BABYLON.Vector3.Zero());

	var camera2 = new BABYLON.FreeCamera("camera2", new BABYLON.Vector3(0, 4, -10), scene);
	camera2.setTarget(BABYLON.Vector3.Zero());

	var camera3 = new BABYLON.FreeCamera("camera3", new BABYLON.Vector3(-7, 2, -0.5), scene);
	camera3.setTarget(BABYLON.Vector3.Zero());

	var camera4 = new BABYLON.FreeCamera("camera4", new BABYLON.Vector3(-4, 3, -4), scene);
	camera4.setTarget(BABYLON.Vector3.Zero());

	scene.activeCameras.push(camera1);
	scene.activeCameras.push(camera2);
	scene.activeCameras.push(camera3);
	scene.activeCameras.push(camera4);

	camera1.viewport = new BABYLON.Viewport(0, 0.5, 0.5, 0.5);
	camera2.viewport = new BABYLON.Viewport(0.5, 0.5, 0.5, 0.5);
	camera3.viewport = new BABYLON.Viewport(0, 0, 0.5, 0.5);
	camera4.viewport = new BABYLON.Viewport(0.5, 0, 0.5, 0.5);
	
	scene.createDefaultLight(true);
	engine.runRenderLoop(function () {
        scene.render();
    });
	
}, function (ex) {
    console.log(ex.message, ex.stack);
});