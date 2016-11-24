var createScene = function () {
    var scene = new BABYLON.Scene(engine);
    var camera = new BABYLON.ArcRotateCamera("Camera", 0, 0, 10, BABYLON.Vector3.Zero(), scene);
    var material = new BABYLON.StandardMaterial("kosh", scene);
    var sphere1 = BABYLON.Mesh.CreateSphere("Sphere1", 32, 5, scene);
    var light = new BABYLON.PointLight("Omni0", new BABYLON.Vector3(-17.6, 18.8, -49.9), scene);

    camera.setPosition(new BABYLON.Vector3(-15, 3, 0));
    camera.attachControl(canvas, true);

    // Sphere1 material
    material.refractionTexture = new BABYLON.CubeTexture("textures/TropicalSunnyDay", scene);
    material.reflectionTexture = new BABYLON.CubeTexture("textures/TropicalSunnyDay", scene);
    material.diffuseColor = new BABYLON.Color3(0, 0, 0);
    material.invertRefractionY = false;
    material.indexOfRefraction = 0.98;
    material.specularPower = 128;
    sphere1.material = material;

    material.refractionFresnelParameters = new BABYLON.FresnelParameters();
    material.refractionFresnelParameters.power = 2;
    material.reflectionFresnelParameters = new BABYLON.FresnelParameters();
    material.reflectionFresnelParameters.power = 2;
    material.reflectionFresnelParameters.leftColor = BABYLON.Color3.Black();
    material.reflectionFresnelParameters.rightColor = BABYLON.Color3.White();

    // Skybox
    var skybox = BABYLON.Mesh.CreateBox("skyBox", 100.0, scene);
    var skyboxMaterial = new BABYLON.StandardMaterial("skyBox", scene);
    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("textures/TropicalSunnyDay", scene);
    skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
    skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
    skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
    skyboxMaterial.disableLighting = true;
    skybox.material = skyboxMaterial;

    return scene;
}
