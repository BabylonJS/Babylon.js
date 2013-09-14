var CreateOctreeTestScene = function (engine) {
    var scene = new BABYLON.Scene(engine);
    var camera = new BABYLON.ArcRotateCamera("Camera", 0, 0, 10, BABYLON.Vector3.Zero(), scene);
    var light0 = new BABYLON.PointLight("Omni0", new BABYLON.Vector3(0, 10, 0), scene);
    var material = new BABYLON.StandardMaterial("kosh", scene);
    var sphere = BABYLON.Mesh.CreateSphere("sphere0", 16, 1, scene);

    camera.setPosition(new BABYLON.Vector3(-10, 10, 0));
    
    // Sphere material
    material.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
    material.specularColor = new BABYLON.Color3(1.0, 1.0, 1.0);
    material.specularPower = 32;
    material.checkReadyOnEveryCall = false;
    sphere.material = material;
    
    // Fog
    scene.fogMode = BABYLON.Scene.FOGMODE_EXP;
    scene.fogDensity = 0.05;
    
    // Clone spheres
    var playgroundSize = 50;
    for (var index = 0; index < 8000; index++) {
        var clone = sphere.clone("sphere" + (index + 1), null, true);
        var scale = Math.random() * 0.8 + 0.6;
        clone.scaling = new BABYLON.Vector3(scale, scale, scale);
        clone.position = new BABYLON.Vector3(Math.random() * 2 * playgroundSize - playgroundSize, Math.random() * 2 * playgroundSize - playgroundSize, Math.random() * 2 * playgroundSize - playgroundSize);
    }
    sphere.setEnabled(false);
    scene.createOrUpdateSelectionOctree();
    
    return scene;
};