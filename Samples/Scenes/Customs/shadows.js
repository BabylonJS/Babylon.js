var CreateShadowsTestScene = function (engine) {
    var scene = new BABYLON.Scene(engine);
    var camera = new BABYLON.ArcRotateCamera("Camera", 0, 0, 10, BABYLON.Vector3.Zero(), scene);
    var light = new BABYLON.DirectionalLight("dir01", new BABYLON.Vector3(0, -1, -0.2), scene);
    var light2 = new BABYLON.DirectionalLight("dir02", new BABYLON.Vector3(-1, -2, -1), scene);
    light.position = new BABYLON.Vector3(0, 30, 0);
    light2.position = new BABYLON.Vector3(10, 20, 10);

    light.intensity = 0.6;
    light2.intensity = 0.6;

    camera.setPosition(new BABYLON.Vector3(-20, 20, 0));
    
    // Skybox
    var skybox = BABYLON.Mesh.CreateBox("skyBox", 1000.0, scene);
    var skyboxMaterial = new BABYLON.StandardMaterial("skyBox", scene);
    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("Scenes/Customs/skybox/night", scene);
    skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
    skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
    skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
    skybox.material = skyboxMaterial;

    // Ground
    var ground = BABYLON.Mesh.CreateGround("ground", 1000, 1000, 1, scene, false);
    var groundMaterial = new BABYLON.StandardMaterial("ground", scene);
    groundMaterial.diffuseTexture = new BABYLON.Texture("assets/grass.jpg", scene);
    groundMaterial.diffuseTexture.uScale = 60;
    groundMaterial.diffuseTexture.vScale = 60;
    groundMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
    groundMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
    ground.position.y = -2.05;
    ground.material = groundMaterial;
    
    // Torus
    var torus = BABYLON.Mesh.CreateTorus("torus", 8, 2, 32, scene, false);
    torus.position.y = 6.0;
    var torus2 = BABYLON.Mesh.CreateTorus("torus2", 4, 1, 32, scene, false);
    torus2.position.y = 6.0;
    
    // Shadows
    var shadowGenerator = new BABYLON.ShadowGenerator(512, light);
    shadowGenerator.getShadowMap().renderList.push(torus);
    shadowGenerator.getShadowMap().renderList.push(torus2);
    
    var shadowGenerator2 = new BABYLON.ShadowGenerator(512, light2);
    shadowGenerator2.getShadowMap().renderList.push(torus);
    shadowGenerator2.getShadowMap().renderList.push(torus2);
    shadowGenerator2.useVarianceShadowMap = false;

    ground.receiveShadows = true;
    
    var beforeRenderFunction = function () {
        // Camera
        if (camera.beta < 0.1)
            camera.beta = 0.1;
        else if (camera.beta > (Math.PI / 2) * 0.99)
            camera.beta = (Math.PI / 2) * 0.99;

        if (camera.radius > 150)
            camera.radius = 150;

        if (camera.radius < 5)
            camera.radius = 5;
    };

    scene.registerBeforeRender(beforeRenderFunction);
    
    // Animations
    scene.registerBeforeRender(function () {
        torus.rotation.x += 0.01;
        torus.rotation.z += 0.02;
        torus2.rotation.x += 0.02;
        torus2.rotation.y += 0.01;
    });
    
    return scene;
};