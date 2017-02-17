var createScene = function () {
    var scene = new BABYLON.Scene(engine);

    // Create camera and light
    var light = new BABYLON.PointLight("Point", new BABYLON.Vector3(5, 10, 5), scene);
    var camera = new BABYLON.ArcRotateCamera("Camera", 1, 0.8, 8, new BABYLON.Vector3(0, 0, 0), scene);
    camera.attachControl(canvas, true);

    // Create a sprite manager to optimize GPU ressources
    // Parameters : name, imgUrl, capacity, cellSize, scene
    var spriteManagerTrees = new BABYLON.SpriteManager("treesManager", "textures/palm.png", 2000, 800, scene);

    //We create 2000 trees at random positions
    for (var i = 0; i < 2000; i++) {
        var tree = new BABYLON.Sprite("tree", spriteManagerTrees);
        tree.position.x = Math.random() * 100 - 50;
        tree.position.z = Math.random() * 100 - 50;
        tree.isPickable = true;

        //Some "dead" trees
        if (Math.round(Math.random() * 5) === 0) {
            tree.angle = Math.PI * 90 / 180;
            tree.position.y = -0.3;
        }
    }

    //Create a manager for the player's sprite animation
    var spriteManagerPlayer = new BABYLON.SpriteManager("playerManager", "textures/player.png", 2, 64, scene);

    // First animated player
    var player = new BABYLON.Sprite("player", spriteManagerPlayer);
    player.playAnimation(0, 40, true, 100);
    player.position.y = -0.3;
    player.size = 0.3;
    player.isPickable = true;

    // Second standing player
    var player2 = new BABYLON.Sprite("player2", spriteManagerPlayer);
    player2.stopAnimation(); // Not animated
    player2.cellIndex = 2; // Going to frame number 2
    player2.position.y = -0.3;
    player2.position.x = 1;
    player2.size = 0.3;
    player2.invertU = -1; //Change orientation
    player2.isPickable = true;


    // Picking
    spriteManagerTrees.isPickable = true;
    spriteManagerPlayer.isPickable = true;

    scene.onPointerDown = function (evt) {
        var pickResult = scene.pickSprite(this.pointerX, this.pointerY);
        if (pickResult.hit) {
            pickResult.pickedSprite.angle += 0.5;
        }
    };


    return scene;
}
