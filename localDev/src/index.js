var createScene = function () {
    var scene = new BABYLON.Scene(engine);

    var light = new BABYLON.PointLight("Omni", new BABYLON.Vector3(-60, 60, 80), scene);

    //Create an Arc Rotate Camera - aimed negative z this time
    var camera = new BABYLON.ArcRotateCamera("Camera", Math.PI / 2, 1.0, 110, BABYLON.Vector3.Zero(), scene);
    camera.attachControl(canvas, true);

    var sphere1 = BABYLON.Mesh.CreateSphere("Sphere1", 10.0, 9.0, scene);
    var sphere2 = BABYLON.Mesh.CreateSphere("Sphere2", 10.0, 9.0, scene);
    sphere1.position.x = 20;
    sphere2.position.x = -20;

    var mat1 = new BABYLON.StandardMaterial("mat1", scene);
    mat1.diffuseColor = new BABYLON.Color3(0, 1, 0);
    
    var mat2 = mat1.clone("mat2");
    mat2.diffuseColor = new BABYLON.Color3(1, 0, 0);
    
    sphere1.material = mat1;
    sphere2.material = mat2;

    console.log(mat1.name, mat1.id);
    console.log(mat2.name, mat2.id);

    return scene;
};
