var CreatePostProcessRefractionTestScene = function (engine) {
    var scene = new BABYLON.Scene(engine);
    var camera = new BABYLON.ArcRotateCamera("Camera", 0, 0, 100, BABYLON.Vector3.Zero(), scene);
    var light = new BABYLON.DirectionalLight("dir01", new BABYLON.Vector3(0, -1, -0.2), scene);
    var light2 = new BABYLON.DirectionalLight("dir02", new BABYLON.Vector3(-1, -2, -1), scene);
    light.position = new BABYLON.Vector3(0, 30, 0);
    light2.position = new BABYLON.Vector3(10, 20, 10);

    light.intensity = 0.6;
    light2.intensity = 0.6;

    camera.setPosition(new BABYLON.Vector3(-60, 60, 0));
    camera.lowerBetaLimit = (Math.PI / 2) * 0.8;
    
    // Skybox
    var skybox = BABYLON.Mesh.CreateBox("skyBox", 1000.0, scene);
    var skyboxMaterial = new BABYLON.StandardMaterial("skyBox", scene);
    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("Scenes/Customs/skybox/snow", scene);
    skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
    skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
    skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
    skybox.material = skyboxMaterial;
    
    // Spheres
    var sphere0 = BABYLON.Mesh.CreateSphere("Sphere0", 16, 10, scene);
    var sphere1 = BABYLON.Mesh.CreateSphere("Sphere1", 16, 10, scene);
    var sphere2 = BABYLON.Mesh.CreateSphere("Sphere2", 16, 10, scene);

    sphere0.material = new BABYLON.StandardMaterial("red", scene);
    sphere0.material.specularColor = new BABYLON.Color3(0, 0, 0);
    sphere0.material.diffuseColor = new BABYLON.Color3(1.0, 0, 0);
    
    sphere1.material = new BABYLON.StandardMaterial("green", scene);
    sphere1.material.specularColor = new BABYLON.Color3(0, 0, 0);
    sphere1.material.diffuseColor = new BABYLON.Color3(0, 1.0, 0);
    
    sphere2.material = new BABYLON.StandardMaterial("blue", scene);
    sphere2.material.specularColor = new BABYLON.Color3(0, 0, 0);
    sphere2.material.diffuseColor = new BABYLON.Color3(0, 0, 1.0);
       
    // Post-process
    var postProcess = new BABYLON.RefractionPostProcess("Refraction", "/scenes/customs/refMap.jpg", new BABYLON.Color3(1.0, 1.0, 1.0), 0.5, 0.5, 1.0, camera);
    
    // Animations
    var alpha = 0;
    scene.registerBeforeRender(function() {
        sphere0.position = new BABYLON.Vector3(20 * Math.sin(alpha), 0, 20 * Math.cos(alpha));
        sphere1.position = new BABYLON.Vector3(20 * Math.sin(alpha), 0, -20 * Math.cos(alpha));
        sphere2.position = new BABYLON.Vector3(20 * Math.cos(alpha), 0, 20 * Math.sin(alpha));

        alpha += 0.01;
    });
    
    return scene;
};