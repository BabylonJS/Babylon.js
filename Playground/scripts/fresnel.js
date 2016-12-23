var createScene = function () {
    var scene = new BABYLON.Scene(engine);
    var camera = new BABYLON.ArcRotateCamera("Camera", 0, 0, 10, BABYLON.Vector3.Zero(), scene);
    var material = new BABYLON.StandardMaterial("kosh", scene);
    var sphere1 = BABYLON.Mesh.CreateSphere("Sphere1", 32, 3, scene);
    var sphere2 = BABYLON.Mesh.CreateSphere("Sphere2", 32, 3, scene);
    var sphere3 = BABYLON.Mesh.CreateSphere("Sphere3", 32, 3, scene);
    var sphere4 = BABYLON.Mesh.CreateSphere("Sphere4", 32, 3, scene);
    var sphere5 = BABYLON.Mesh.CreateSphere("Sphere5", 32, 3, scene);
    var light = new BABYLON.PointLight("Omni0", new BABYLON.Vector3(-17.6, 18.8, -49.9), scene);

    camera.setPosition(new BABYLON.Vector3(-15, 3, 0));
    camera.attachControl(canvas, true);

    sphere2.position.z -= 5;
    sphere3.position.z += 5;
    sphere4.position.x += 5;
    sphere5.position.x -= 5;

    // Sphere1 material
    material.reflectionTexture = new BABYLON.CubeTexture("textures/TropicalSunnyDay", scene);
    material.diffuseColor = new BABYLON.Color3(0, 0, 0);
    material.emissiveColor = new BABYLON.Color3(0.5, 0.5, 0.5);
    material.alpha = 0.2;
    material.specularPower = 16;

    // Fresnel
    material.reflectionFresnelParameters = new BABYLON.FresnelParameters();
    material.reflectionFresnelParameters.bias = 0.1;

    material.emissiveFresnelParameters = new BABYLON.FresnelParameters();
    material.emissiveFresnelParameters.bias = 0.6;
    material.emissiveFresnelParameters.power = 4;
    material.emissiveFresnelParameters.leftColor = BABYLON.Color3.White();
    material.emissiveFresnelParameters.rightColor = BABYLON.Color3.Black();

    material.opacityFresnelParameters = new BABYLON.FresnelParameters();
    material.opacityFresnelParameters.leftColor = BABYLON.Color3.White();
    material.opacityFresnelParameters.rightColor = BABYLON.Color3.Black();

    sphere1.material = material;

    // Sphere2 material
    material = new BABYLON.StandardMaterial("kosh2", scene);
    material.reflectionTexture = new BABYLON.CubeTexture("textures/TropicalSunnyDay", scene);
    material.diffuseColor = new BABYLON.Color3(0, 0, 0);
    material.emissiveColor = new BABYLON.Color3(0.5, 0.5, 0.5);
    material.specularPower = 32;

    // Fresnel
    material.reflectionFresnelParameters = new BABYLON.FresnelParameters();
    material.reflectionFresnelParameters.bias = 0.1;

    material.emissiveFresnelParameters = new BABYLON.FresnelParameters();
    material.emissiveFresnelParameters.bias = 0.5;
    material.emissiveFresnelParameters.power = 4;
    material.emissiveFresnelParameters.leftColor = BABYLON.Color3.White();
    material.emissiveFresnelParameters.rightColor = BABYLON.Color3.Black();

    sphere2.material = material;

    // Sphere3 material
    material = new BABYLON.StandardMaterial("kosh3", scene);
    material.diffuseColor = new BABYLON.Color3(0, 0, 0);
    material.emissiveColor = BABYLON.Color3.White();
    material.specularPower = 64;
    material.alpha = 0.2;

    // Fresnel
    material.emissiveFresnelParameters = new BABYLON.FresnelParameters();
    material.emissiveFresnelParameters.bias = 0.2;
    material.emissiveFresnelParameters.leftColor = BABYLON.Color3.White();
    material.emissiveFresnelParameters.rightColor = BABYLON.Color3.Black();

    material.opacityFresnelParameters = new BABYLON.FresnelParameters();
    material.opacityFresnelParameters.power = 4;
    material.opacityFresnelParameters.leftColor = BABYLON.Color3.White();
    material.opacityFresnelParameters.rightColor = BABYLON.Color3.Black();

    sphere3.material = material;

    // Sphere4 material
    material = new BABYLON.StandardMaterial("kosh4", scene);
    material.diffuseColor = new BABYLON.Color3(0, 0, 0);
    material.emissiveColor = BABYLON.Color3.White();
    material.specularPower = 64;

    // Fresnel
    material.emissiveFresnelParameters = new BABYLON.FresnelParameters();
    material.emissiveFresnelParameters.power = 4;
    material.emissiveFresnelParameters.bias = 0.5;
    material.emissiveFresnelParameters.leftColor = BABYLON.Color3.White();
    material.emissiveFresnelParameters.rightColor = BABYLON.Color3.Black();

    sphere4.material = material;

    // Sphere5 material
    material = new BABYLON.StandardMaterial("kosh5", scene);
    material.diffuseColor = new BABYLON.Color3(0, 0, 0);
    material.reflectionTexture = new BABYLON.CubeTexture("textures/TropicalSunnyDay", scene);
    material.reflectionTexture.level = 0.5;
    material.specularPower = 64;
    material.emissiveColor = new BABYLON.Color3(0.2, 0.2, 0.2);

    // Fresnel
    material.emissiveFresnelParameters = new BABYLON.FresnelParameters();
    material.emissiveFresnelParameters.bias = 0.4;
    material.emissiveFresnelParameters.power = 2;
    material.emissiveFresnelParameters.leftColor = BABYLON.Color3.Black();
    material.emissiveFresnelParameters.rightColor = BABYLON.Color3.White();

    sphere5.material = material;

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
