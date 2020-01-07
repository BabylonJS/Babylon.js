// playground : https://www.babylonjs-playground.com/#95IQS6
function CreateBoxAsync() {
    BABYLON.Mesh.CreateBox("box1", 0.7);
    return Promise.resolve();
}
var engine = new BABYLON.NativeEngine();
var scene = new BABYLON.Scene(engine);

CreateBoxAsync().then(function () {
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
	
	
	var rttTexture = new BABYLON.RenderTargetTexture("rtt", 1024, scene);
	scene.meshes.forEach(mesh => {
		rttTexture.renderList.push(mesh);
	});
	rttTexture.activeCamera = new BABYLON.FreeCamera("camera5", new BABYLON.Vector3(2, 2, 2), scene);
	rttTexture.activeCamera.setTarget(BABYLON.Vector3.Zero());
	rttTexture.vScale = -1;

	scene.customRenderTargets.push(rttTexture);

	var rttMaterial = new BABYLON.StandardMaterial("rttMaterial", scene);
	rttMaterial.diffuseTexture = rttTexture;

	var plane = BABYLON.MeshBuilder.CreatePlane("rttPlane", { width: 2, height: 2 }, scene);
	plane.position.x = 2;
	plane.material = rttMaterial;

	
	scene.createDefaultLight(true);
	engine.runRenderLoop(function () {
        scene.render();
    });
	
}, function (ex) {
    console.log(ex.message, ex.stack);
});