var CreateConvolutionTestScene = function (engine) {
    var scene = new BABYLON.Scene(engine);
    var camera = new BABYLON.ArcRotateCamera("Camera", 0, 0, 10, BABYLON.Vector3.Zero(), scene);
    var light = new BABYLON.DirectionalLight("dir01", new BABYLON.Vector3(0, -1, -0.2), scene);
    var light2 = new BABYLON.DirectionalLight("dir02", new BABYLON.Vector3(-1, 2, -1), scene);
    light.position = new BABYLON.Vector3(0, 30, 0);
    light2.position = new BABYLON.Vector3(10, 20, 10);

    light.intensity = 0.6;
    light2.intensity = 0.6;

    camera.setPosition(new BABYLON.Vector3(-40, 40, 0));

    // Skybox
    var skybox = BABYLON.Mesh.CreateBox("skyBox", 500.0, scene);
    var skyboxMaterial = new BABYLON.StandardMaterial("skyBox", scene);
    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("Scenes/Customs/skybox/skybox", scene);
    skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
    skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
    skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
    skybox.material = skyboxMaterial;
    skybox.infiniteDistance = true;
        
    // Spheres
    var sphere0 = BABYLON.Mesh.CreateSphere("Sphere0", 16, 10, scene);
    var sphere1 = BABYLON.Mesh.CreateSphere("Sphere1", 16, 10, scene);
    var sphere2 = BABYLON.Mesh.CreateSphere("Sphere2", 16, 10, scene);
    var cube = BABYLON.Mesh.CreateBox("Cube", 10.0, scene);

    sphere0.material = new BABYLON.StandardMaterial("white", scene);
    sphere0.material.diffuseColor = new BABYLON.Color3(0.5, 0.5, 1.0);
    
    sphere1.material = sphere0.material;
    sphere2.material = sphere0.material;

    sphere0.convertToFlatShadedMesh();
    sphere1.convertToFlatShadedMesh();
    sphere2.convertToFlatShadedMesh();
    
    cube.material = new BABYLON.StandardMaterial("red", scene);
    cube.material.diffuseColor = new BABYLON.Color3(1.0, 0.5, 0.5);
    cube.material.specularColor = new BABYLON.Color3(0, 0, 0);
       
    // Post-process
    var postProcess = new BABYLON.ConvolutionPostProcess("convolution", BABYLON.ConvolutionPostProcess.EmbossKernel, 1.0, camera);
    
    // Animations
    var alpha = 0;
    scene.registerBeforeRender(function() {
        sphere0.position = new BABYLON.Vector3(20 * Math.sin(alpha), 0, 20 * Math.cos(alpha));
        sphere1.position = new BABYLON.Vector3(20 * Math.sin(alpha), -20 * Math.cos(alpha), 0);
        sphere2.position = new BABYLON.Vector3(0, 20 * Math.cos(alpha), 20 * Math.sin(alpha));

        cube.rotation.y += 0.01;
        cube.rotation.z += 0.01;

        alpha += 0.05;
    });
    
    return scene;
};