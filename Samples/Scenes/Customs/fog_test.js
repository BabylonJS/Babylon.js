var CreateFogScene = function(engine) {
    var scene = new BABYLON.Scene(engine);
    var camera = new BABYLON.FreeCamera("Camera", new BABYLON.Vector3(0, 0, -20), scene);
    var light = new BABYLON.PointLight("Omni", new BABYLON.Vector3(20, 100, 2), scene);
    var sphere0 = BABYLON.Mesh.CreateSphere("Sphere0", 16, 3, scene);
    var sphere1 = BABYLON.Mesh.CreateSphere("Sphere1", 16, 3, scene);
    var sphere2 = BABYLON.Mesh.CreateSphere("Sphere2", 16, 3, scene);

    var material0 = new BABYLON.StandardMaterial("mat0", scene);
    material0.diffuseColor = new BABYLON.Color3(1, 0, 0);
    sphere0.material = material0;
    sphere0.position = new BABYLON.Vector3(-10, 0, 0);

    var material1 = new BABYLON.StandardMaterial("mat1", scene);
    material1.diffuseColor = new BABYLON.Color3(1, 1, 0);
    sphere1.material = material1;

    var material2 = new BABYLON.StandardMaterial("mat2", scene);
    material2.diffuseColor = new BABYLON.Color3(1, 0, 1);
    sphere2.material = material2;
    sphere2.position = new BABYLON.Vector3(10, 0, 0);

    sphere1.convertToFlatShadedMesh();
    
    camera.setTarget(new BABYLON.Vector3(0, 0, 0));
    
    // Fog
    scene.fogMode = BABYLON.Scene.FOGMODE_EXP;
    scene.fogDensity = 0.1;

    // Animations
    var alpha = 0;
    scene.registerBeforeRender(function () {
        sphere0.position.z = 4 * Math.cos(alpha);
        sphere1.position.z = 4 * Math.sin(alpha);
        sphere2.position.z = 4 * Math.cos(alpha);

        alpha += 0.1;
    });

    return scene;
};