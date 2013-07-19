var CreateBumpScene = function (engine) {
    var scene = new BABYLON.Scene(engine);
    var camera = new BABYLON.ArcRotateCamera("Camera", 0, 0, 10, BABYLON.Vector3.Zero(), scene);
    var light = new BABYLON.PointLight("Omni", new BABYLON.Vector3(20, 100, 2), scene);
    var sphere = BABYLON.Mesh.CreateSphere("Sphere", 16, 3, scene);
    var material = new BABYLON.StandardMaterial("kosh", scene);
    material.bumpTexture = new BABYLON.Texture("Scenes/Customs/normalMap.jpg", scene);
    material.diffuseColor = new BABYLON.Color3(1, 0, 0);
    
    sphere.material = material;
    
    camera.setPosition(new BABYLON.Vector3(-5, 5, 0));

    // Animations
    scene.registerBeforeRender(function() {
        sphere.rotation.y += 0.02;
    });

    return scene;
};