var createScene = function () {
	var scene = new BABYLON.Scene(engine);

	//Adding a light
	var light = new BABYLON.PointLight("Omni", new BABYLON.Vector3(20, 20, 100), scene);

	//Adding an Arc Rotate Camera
	var camera = new BABYLON.ArcRotateCamera("Camera", -0.5, 2.2, 100, BABYLON.Vector3.Zero(), scene);
	camera.attachControl(canvas, false);

	// The first parameter can be used to specify which mesh to import. Here we import all meshes
	BABYLON.SceneLoader.ImportMesh("", "scenes/", "skull.babylon", scene, function (newMeshes) {
		// Set the target of the camera to the first imported mesh
		camera.target = newMeshes[0];

		newMeshes[0].material = new BABYLON.StandardMaterial("skull", scene);
		newMeshes[0].material.emissiveColor = new BABYLON.Color3(0.2, 0.2, 0.2);
	});

	// Create the "God Rays" effect (volumetric light scattering)
	var godrays = new BABYLON.VolumetricLightScatteringPostProcess('godrays', 1.0, camera, null, 100, BABYLON.Texture.BILINEAR_SAMPLINGMODE, engine, false);

	// By default it uses a billboard to render the sun, just apply the desired texture
	// position and scale
	godrays.mesh.material.diffuseTexture = new BABYLON.Texture('textures/sun.png', scene, true, false, BABYLON.Texture.BILINEAR_SAMPLINGMODE);
	godrays.mesh.material.diffuseTexture.hasAlpha = true;
	godrays.mesh.position = new BABYLON.Vector3(-150, 150, 150);
	godrays.mesh.scaling = new BABYLON.Vector3(350, 350, 350);

	light.position = godrays.mesh.position;

	return scene;
}
