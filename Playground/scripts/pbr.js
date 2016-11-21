var createScene = function () {
    var scene = new BABYLON.Scene(engine);
    var camera = new BABYLON.ArcRotateCamera("Camera", -Math.PI / 4, Math.PI / 2.5, 200, BABYLON.Vector3.Zero(), scene);
    camera.attachControl(canvas, true);
    camera.minZ = 0.1;

    // Light
    new BABYLON.PointLight("point", new BABYLON.Vector3(20, 20, 10), scene);

    // Environment Texture
    var hdrTexture = new BABYLON.HDRCubeTexture("textures/room.hdr", scene, 512);

    // Skybox
    var hdrSkybox = BABYLON.Mesh.CreateBox("hdrSkyBox", 1000.0, scene);
    var hdrSkyboxMaterial = new BABYLON.StandardMaterial("skyBox", scene);
    hdrSkyboxMaterial.backFaceCulling = false;
    hdrSkyboxMaterial.reflectionTexture = hdrTexture.clone();
    hdrSkyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
    hdrSkyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
    hdrSkyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
    hdrSkyboxMaterial.disableLighting = true;
    hdrSkybox.material = hdrSkyboxMaterial;
    hdrSkybox.infiniteDistance = true;

    // Create meshes
    var sphereGlass = BABYLON.Mesh.CreateSphere("sphere", 48, 30.0, scene);
    sphereGlass.translate(new BABYLON.Vector3(1, 0, 0), -50);

    var sphereMetal = BABYLON.Mesh.CreateSphere("sphere", 48, 30.0, scene);
    sphereMetal.translate(new BABYLON.Vector3(1, 0, 0), 50);

    var woodPlank = BABYLON.MeshBuilder.CreateBox("plane", { width: 45, height: 1, depth: 90 }, scene);

    // Create materials
    var glass = new BABYLON.PBRMaterial("glass", scene);
    glass.reflectionTexture = hdrTexture;
    glass.refractionTexture = hdrTexture;
    glass.linkRefractionWithTransparency = true;
    glass.indexOfRefraction = 0.52;
    glass.alpha = 0;
    glass.directIntensity = 0.0;
    glass.environmentIntensity = 0.5;
    glass.cameraExposure = 0.5;
    glass.cameraContrast = 1.7;
    glass.microSurface = 1;
    glass.reflectivityColor = new BABYLON.Color3(0.1, 0.1, 0.1);
    glass.albedoColor = new BABYLON.Color3(0.3, 0.3, 0.3);
    sphereGlass.material = glass;

    var metal = new BABYLON.PBRMaterial("metal", scene);
    metal.reflectionTexture = hdrTexture;
    metal.directIntensity = 0.3;
    metal.environmentIntensity = 0.7;
    metal.cameraExposure = 0.6;
    metal.cameraContrast = 1.6;
    metal.microSurface = 0.96;
    metal.reflectivityColor = new BABYLON.Color3(0.9, 0.9, 0.9);
    metal.albedoColor = new BABYLON.Color3(1, 1, 1);
    sphereMetal.material = metal;

    var wood = new BABYLON.PBRMaterial("wood", scene);
    wood.reflectionTexture = hdrTexture;
    wood.directIntensity = 1.5;
    wood.environmentIntensity = 0.5;
    wood.specularIntensity = 0.3;
    wood.cameraExposure = 0.9;
    wood.cameraContrast = 1.6;

    wood.reflectivityTexture = new BABYLON.Texture("textures/reflectivity.png", scene);
    wood.useMicroSurfaceFromReflectivityMapAlpha = true;

    wood.albedoColor = BABYLON.Color3.White();
    wood.albedoTexture = new BABYLON.Texture("textures/albedo.png", scene);
    woodPlank.material = wood;
    return scene;
};