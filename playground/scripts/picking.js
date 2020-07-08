var createScene = function () {
    var scene = new BABYLON.Scene(engine);

    // setup environment
    var light0 = new BABYLON.PointLight("Omni", new BABYLON.Vector3(0, 10, 20), scene);
    var freeCamera = new BABYLON.FreeCamera("FreeCamera", new BABYLON.Vector3(0, 0, -30), scene);

    // Impact impostor
    var impact = BABYLON.Mesh.CreatePlane("impact", 1, scene);
    impact.material = new BABYLON.StandardMaterial("impactMat", scene);
    impact.material.diffuseTexture = new BABYLON.Texture("textures/impact.png", scene);
    impact.material.diffuseTexture.hasAlpha = true;
    impact.position = new BABYLON.Vector3(0, 0, -0.1);

    //Wall
    var wall = BABYLON.Mesh.CreatePlane("wall", 20.0, scene);
    wall.material = new BABYLON.StandardMaterial("wallMat", scene);
    wall.material.emissiveColor = new BABYLON.Color3(0.5, 1, 0.5);

    //When pointer down event is raised
    scene.onPointerDown = function (evt, pickResult) {
        // if the click hits the ground object, we change the impact position
        if (pickResult.hit) {
            impact.position.x = pickResult.pickedPoint.x;
            impact.position.y = pickResult.pickedPoint.y;
        }
    };

    return scene;
}
