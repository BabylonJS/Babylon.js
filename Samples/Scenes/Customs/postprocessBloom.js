var CreatePostProcessBloomTestScene = function (engine) {
    var scene = new BABYLON.Scene(engine);
    var camera = new BABYLON.ArcRotateCamera("Camera", 0, 0, 10, BABYLON.Vector3.Zero(), scene);
    var light = new BABYLON.DirectionalLight("dir01", new BABYLON.Vector3(0, -1, -0.2), scene);
    var light2 = new BABYLON.DirectionalLight("dir02", new BABYLON.Vector3(-1, -2, -1), scene);
    light.position = new BABYLON.Vector3(0, 30, 0);
    light2.position = new BABYLON.Vector3(10, 20, 10);

    light.intensity = 0.6;
    light2.intensity = 0.6;

    camera.setPosition(new BABYLON.Vector3(-40, 40, 0));
    camera.lowerBetaLimit = (Math.PI / 2) * 0.9;
    
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
    var cube = BABYLON.Mesh.CreateBox("Cube", 10.0, scene);

    sphere0.material = new BABYLON.StandardMaterial("white", scene);
    sphere0.material.diffuseColor = new BABYLON.Color3(0, 0, 0);
    sphere0.material.specularColor = new BABYLON.Color3(0, 0, 0);
    sphere0.material.emissiveColor = new BABYLON.Color3(1.0, 1.0, 1.0);
    
    sphere1.material = sphere0.material;
    sphere2.material = sphere0.material;
    
    cube.material = new BABYLON.StandardMaterial("red", scene);
    cube.material.diffuseColor = new BABYLON.Color3(0, 0, 0);
    cube.material.specularColor = new BABYLON.Color3(0, 0, 0);
    cube.material.emissiveColor = new BABYLON.Color3(1.0, 0, 0);
       
    // Post-process
    var blurWidth = 1.0;
    
    var postProcess0 = new BABYLON.PassPostProcess("Scene copy", 1.0, camera);
    var postProcess1 = new BABYLON.PostProcess("Down sample", "./Scenes/Customs/postprocesses/downsample", ["screenSize", "highlightThreshold"], null, 0.25, camera, BABYLON.Texture.BILINEAR_SAMPLINGMODE);
    postProcess1.onApply = function (effect) {
        effect.setFloat2("screenSize", postProcess1.width, postProcess1.height);
        effect.setFloat("highlightThreshold", 0.90);
    };
    var postProcess2 = new BABYLON.BlurPostProcess("Horizontal blur", new BABYLON.Vector2(1.0, 0), blurWidth, 0.25, camera);
    var postProcess3 = new BABYLON.BlurPostProcess("Vertical blur", new BABYLON.Vector2(0, 1.0), blurWidth, 0.25, camera);
    var postProcess4 = new BABYLON.PostProcess("Final compose", "./Scenes/Customs/postprocesses/compose", ["sceneIntensity", "glowIntensity", "highlightIntensity"], ["sceneSampler"], 1, camera);
    postProcess4.onApply = function (effect) {
        effect.setTextureFromPostProcess("sceneSampler", postProcess0);
        effect.setFloat("sceneIntensity", 0.5);
        effect.setFloat("glowIntensity", 0.4);
        effect.setFloat("highlightIntensity", 1.0);
    };
    
    // Animations
    var alpha = 0;
    scene.registerBeforeRender(function() {
        sphere0.position = new BABYLON.Vector3(20 * Math.sin(alpha), 0, 20 * Math.cos(alpha));
        sphere1.position = new BABYLON.Vector3(20 * Math.sin(alpha), 0, -20 * Math.cos(alpha));
        sphere2.position = new BABYLON.Vector3(20 * Math.cos(alpha), 0, 20 * Math.sin(alpha));

        cube.rotation.y += 0.01;
        cube.rotation.z += 0.01;

        alpha += 0.01;
    });
    
    return scene;
};