var createScene = function () {
    var scene = new BABYLON.Scene(engine);
    var camera = new BABYLON.ArcRotateCamera("Camera", -Math.PI / 4, Math.PI / 2.5, 200, BABYLON.Vector3.Zero(), scene);
    camera.attachControl(canvas, true);
    camera.minZ = 0.1;
    
    // Environment Texture
    var hdrTexture = new BABYLON.HDRCubeTexture("textures/room.hdr", scene, 512);

    var exposure = 0.6;
    var contrast = 1.6;

    // Skybox
    var hdrSkybox = BABYLON.Mesh.CreateBox("hdrSkyBox", 1000.0, scene);
    var hdrSkyboxMaterial = new BABYLON.PBRMaterial("skyBox", scene);
    hdrSkyboxMaterial.backFaceCulling = false;
    hdrSkyboxMaterial.reflectionTexture = hdrTexture.clone();
    hdrSkyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
	hdrSkyboxMaterial.microSurface = 1.0;
	hdrSkyboxMaterial.cameraExposure = exposure;
	hdrSkyboxMaterial.cameraContrast = contrast;
    hdrSkyboxMaterial.disableLighting = true;
    hdrSkybox.material = hdrSkyboxMaterial;
    hdrSkybox.infiniteDistance = true;

    // Create meshes
    var sphereGlass = BABYLON.Mesh.CreateSphere("sphereGlass", 48, 30.0, scene);
    sphereGlass.translate(new BABYLON.Vector3(1, 0, 0), -60);

    var sphereMetal = BABYLON.Mesh.CreateSphere("sphereMetal", 48, 30.0, scene);
    sphereMetal.translate(new BABYLON.Vector3(1, 0, 0), 60);

	var spherePlastic = BABYLON.Mesh.CreateSphere("spherePlastic", 48, 30.0, scene);
    spherePlastic.translate(new BABYLON.Vector3(0, 0, 1), -60);

    var woodPlank = BABYLON.MeshBuilder.CreateBox("plane", { width: 65, height: 1, depth: 65 }, scene);

    // Create materials
    var glass = new BABYLON.PBRMaterial("glass", scene);
    glass.reflectionTexture = hdrTexture;
    glass.refractionTexture = hdrTexture;
    glass.linkRefractionWithTransparency = true;
    glass.indexOfRefraction = 0.52;
    glass.alpha = 0;
    glass.cameraExposure = exposure;
    glass.cameraContrast = contrast;
    glass.microSurface = 1;
    glass.reflectivityColor = new BABYLON.Color3(0.2, 0.2, 0.2);
    glass.albedoColor = new BABYLON.Color3(0.85, 0.85, 0.85);
    sphereGlass.material = glass;

    var metal = new BABYLON.PBRMaterial("metal", scene);
    metal.reflectionTexture = hdrTexture;
    metal.cameraExposure = exposure;
    metal.cameraContrast = 1.6;
    metal.microSurface = 0.96;
    metal.reflectivityColor = new BABYLON.Color3(0.85, 0.85, 0.85);
    metal.albedoColor = new BABYLON.Color3(0.01, 0.01, 0.01);
    sphereMetal.material = metal;
	
	var plastic = new BABYLON.PBRMaterial("plastic", scene);
    plastic.reflectionTexture = hdrTexture;
    plastic.cameraExposure = exposure;
    plastic.cameraContrast = contrast;
    plastic.microSurface = 0.96;
	plastic.albedoColor = new BABYLON.Color3(0.206, 0.94, 1);
	plastic.reflectivityColor = new BABYLON.Color3(0.07, 0.07, 0.07);
    spherePlastic.material = plastic;

    var wood = new BABYLON.PBRMaterial("wood", scene);
    wood.reflectionTexture = hdrTexture;
    wood.environmentIntensity = 1;
    wood.specularIntensity = 0.3;
    wood.cameraExposure = exposure;
    wood.cameraContrast = contrast;

    wood.reflectivityTexture = new BABYLON.Texture("textures/reflectivity.png", scene);
    wood.useMicroSurfaceFromReflectivityMapAlpha = true;

    wood.albedoColor = BABYLON.Color3.White();
    wood.albedoTexture = new BABYLON.Texture("textures/albedo.png", scene);
    woodPlank.material = wood;
		
    return scene;
};