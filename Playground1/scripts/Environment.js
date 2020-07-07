function createScene() {
    var scene = new BABYLON.Scene(engine);

    var light = new BABYLON.PointLight("Omni", new BABYLON.Vector3(10, 50, 50), scene);
    var camera = new BABYLON.ArcRotateCamera("Camera", 0.4, 1.2, 20, new BABYLON.Vector3(-10, 0, 0), scene);

    camera.attachControl(canvas, true);

    var material1 = new BABYLON.StandardMaterial("mat1", scene);
    material1.diffuseColor = new BABYLON.Color3(1, 1, 0);

    for (var i = 0; i < 10; i++) {
        var box = BABYLON.Mesh.CreateBox("Box", 1.0, scene);
        box.material = material1;
        box.position = new BABYLON.Vector3(-i * 5, 0, 0);
    }

    // Fog
    scene.fogMode = BABYLON.Scene.FOGMODE_EXP;
    //BABYLON.Scene.FOGMODE_NONE;
    //BABYLON.Scene.FOGMODE_EXP;
    //BABYLON.Scene.FOGMODE_EXP2;
    //BABYLON.Scene.FOGMODE_LINEAR;

    scene.fogColor = new BABYLON.Color3(0.9, 0.9, 0.85);
    scene.fogDensity = 0.01;

    //Only if LINEAR
    //scene.fogStart = 20.0;
    //scene.fogEnd = 60.0;

    // Skybox
    var skybox = BABYLON.Mesh.CreateBox("skyBox", 100.0, scene);
    var skyboxMaterial = new BABYLON.StandardMaterial("skyBox", scene);
    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("textures/skybox", scene);
    skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
    skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
    skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
    skyboxMaterial.disableLighting = true;
    skybox.material = skyboxMaterial;

    var alpha = 0;
    scene.registerBeforeRender(function () {

        scene.fogDensity = Math.cos(alpha) / 10;
        alpha += 0.02;

    });

    return scene;
};