var CreateLensFlaresTestScene = function (engine) {
    var scene = new BABYLON.Scene(engine);
    var camera = new BABYLON.ArcRotateCamera("Camera", 0, 0, 10, BABYLON.Vector3.Zero(), scene);
    var light0 = new BABYLON.PointLight("Omni0", new BABYLON.Vector3(21.84, 50, -28.26), scene);

    camera.alpha = 2.8;
    camera.beta = 2.25;
    
    // Creating light sphere
    var lightSphere0 = BABYLON.Mesh.CreateSphere("Sphere0", 16, 0.5, scene);
    
    lightSphere0.material = new BABYLON.StandardMaterial("white", scene);
    lightSphere0.material.diffuseColor = new BABYLON.Color3(0, 0, 0);
    lightSphere0.material.specularColor = new BABYLON.Color3(0, 0, 0);
    lightSphere0.material.emissiveColor = new BABYLON.Color3(1, 1, 1);

    lightSphere0.position = light0.position;
    
    var lensFlareSystem = new BABYLON.LensFlareSystem("lensFlareSystem", light0, scene);
    var flare00 = new BABYLON.LensFlare(0.2, 0, new BABYLON.Color3(1, 1, 1), "Assets/lens5.png", lensFlareSystem);
    var flare01 = new BABYLON.LensFlare(0.5, 0.2, new BABYLON.Color3(0.5, 0.5, 1), "Assets/lens4.png", lensFlareSystem);
    var flare02 = new BABYLON.LensFlare(0.2, 1.0, new BABYLON.Color3(1, 1, 1), "Assets/lens4.png", lensFlareSystem);
    var flare03 = new BABYLON.LensFlare(0.4, 0.4, new BABYLON.Color3(1, 0.5, 1), "Assets/Flare.png", lensFlareSystem);
    var flare04 = new BABYLON.LensFlare(0.1, 0.6, new BABYLON.Color3(1, 1, 1), "Assets/lens5.png", lensFlareSystem);
    var flare05 = new BABYLON.LensFlare(0.3, 0.8, new BABYLON.Color3(1, 1, 1), "Assets/lens4.png", lensFlareSystem);


    // Skybox
    var skybox = BABYLON.Mesh.CreateBox("skyBox", 100.0, scene);
    var skyboxMaterial = new BABYLON.StandardMaterial("skyBox", scene);
    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("Scenes/Customs/skybox/skybox", scene);
    skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
    skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
    skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
    skybox.material = skyboxMaterial;

    return scene;
};