var createScene = function () {
    var scene = new BABYLON.Scene(engine);

    // Setup a simple environment
    var light0 = new BABYLON.PointLight("Omni", new BABYLON.Vector3(0, 2, 8), scene);
    var box1 = BABYLON.Mesh.CreateBox("b1", 1.0, scene);
    var box2 = BABYLON.Mesh.CreateBox("b2", 1.0, scene);
    box2.position.x = -3;
    var box3 = BABYLON.Mesh.CreateBox("b3", 1.0, scene);
    box3.position.x = 3;

    // ArcRotateCamera >> Camera rotating around a 3D point (here Vector zero)
    // Parameters : name, alpha, beta, radius, target, scene
    var arcCamera = new BABYLON.ArcRotateCamera("ArcRotateCamera", 1, 0.8, 10, new BABYLON.Vector3(0, 0, 0), scene);
    arcCamera.setPosition(new BABYLON.Vector3(0, 0, 50));
    arcCamera.target = new BABYLON.Vector3(3, 0, 0);

    // FreeCamera >> You can move around the world with mouse and keyboard (LEFT/RIGHT/UP/DOWN)
    // Parameters : name, position, scene
    var freeCamera = new BABYLON.FreeCamera("FreeCamera", new BABYLON.Vector3(0, 0, 5), scene);
    freeCamera.rotation = new BABYLON.Vector3(0, Math.PI, 0);

    // TouchCamera >> Move in your world with your touch screen (or with your mouse, by drag/drop)
    // Parameters : name, position, scene
    var touchCamera = new BABYLON.TouchCamera("TouchCamera", new BABYLON.Vector3(0, 0, 10), scene);
    touchCamera.rotation = new BABYLON.Vector3(0, Math.PI, 0);

    //Attach a camera to the scene and the canvas
    scene.activeCamera = freeCamera;
    freeCamera.attachControl(canvas, true);

    return scene;
}