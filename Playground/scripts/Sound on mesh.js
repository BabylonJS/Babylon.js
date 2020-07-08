var createScene = function () {
    // This creates a basic Babylon Scene object (non-mesh)
    var scene = new BABYLON.Scene(engine);

    // Lights
    var light0 = new BABYLON.DirectionalLight("Omni", new BABYLON.Vector3(-2, -5, 2), scene);
    var light1 = new BABYLON.PointLight("Omni", new BABYLON.Vector3(2, -5, -2), scene);

    // Need a free camera for collisions
    var camera = new BABYLON.FreeCamera("FreeCamera", new BABYLON.Vector3(0, -8, -20), scene);
    camera.attachControl(canvas, true);

    //Ground
    var ground = BABYLON.Mesh.CreatePlane("ground", 400.0, scene);
    ground.material = new BABYLON.StandardMaterial("groundMat", scene);
    ground.material.diffuseColor = new BABYLON.Color3(1, 1, 1);
    ground.material.backFaceCulling = false;
    ground.position = new BABYLON.Vector3(5, -10, -15);
    ground.rotation = new BABYLON.Vector3(Math.PI / 2, 0, 0);

    //Simple crate
    var box = BABYLON.Mesh.CreateBox("crate", 2, scene);
    box.material = new BABYLON.StandardMaterial("Mat", scene);
    box.material.diffuseTexture = new BABYLON.Texture("textures/crate.png", scene);
    box.position = new BABYLON.Vector3(10, -9, 0);

    // Create and load the sound async
    var music = new BABYLON.Sound("Violons", "sounds/violons11.wav", scene, function () {
        // Call with the sound is ready to be played (loaded & decoded)
        // TODO: add your logic
        console.log("Sound ready to be played!");
    }, { loop: true, autoplay: true });

    // Sound will now follow the mesh position
    music.attachToMesh(box);

    //Set gravity for the scene (G force like, on Y-axis)
    scene.gravity = new BABYLON.Vector3(0, -0.9, 0);

    // Enable Collisions
    scene.collisionsEnabled = true;

    //Then apply collisions and gravity to the active camera
    camera.checkCollisions = true;
    camera.applyGravity = true;

    //Set the ellipsoid around the camera (e.g. your player's size)
    camera.ellipsoid = new BABYLON.Vector3(1, 1, 1);

    //finally, say which mesh will be collisionable
    ground.checkCollisions = true;

    var alpha = 0;

    scene.registerBeforeRender(function () {
        // Moving the box will automatically move the associated sound attached to it
        box.position = new BABYLON.Vector3(Math.cos(alpha) * 30, -9, Math.sin(alpha) * 30);
        alpha += 0.01;
    });

    return scene;
};