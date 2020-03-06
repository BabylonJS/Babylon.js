var createScene = function () {

    // This creates a basic Babylon Scene object (non-mesh)
    var scene = new BABYLON.Scene(engine);

    // Environment
    var hdrTexture = BABYLON.CubeTexture.CreateFromPrefilteredData("https://playground.babylonjs.com/textures/environment.env", scene);
    hdrTexture.name = "envTex";
    hdrTexture.gammaSpace = false;
    scene.environmentTexture = hdrTexture;

    // Camera
    var camera = new BABYLON.ArcRotateCamera("Camera", BABYLON.Tools.ToRadians(-120), BABYLON.Tools.ToRadians(80), 65, new BABYLON.Vector3(0, -15, 0), scene);
    camera.useAutoRotationBehavior = true;
    camera.autoRotationBehavior.idleRotationSpeed = 0.3;

    // Physics
    scene.enablePhysics(new BABYLON.Vector3(0, -12, 0), new BABYLON.AmmoJSPlugin());

    // Lights
    var light1 = new BABYLON.PointLight("light1", new BABYLON.Vector3(0, 5, -6), scene);
    var light2 = new BABYLON.PointLight("light2", new BABYLON.Vector3(6, 5, 3.5), scene);
    var light3 = new BABYLON.DirectionalLight("light3", new BABYLON.Vector3(20, -5, 20), scene);
    light1.intensity = 15;
    light2.intensity = 5;

    // Create an array of different starting positions for the marbles
    var marbleStartPosArray = [new BABYLON.Vector3(0.2, 3.5, 0), new BABYLON.Vector3(0, 3.5, 0.2), new BABYLON.Vector3(-0.2, 3.5, 0), new BABYLON.Vector3(0, 3.5, -0.2)];

    // Create a box used to trigger the destrucion of marbles
    var killBox = BABYLON.MeshBuilder.CreateBox("killBox", { width: 100, depth: 100, height: 0.5 }, scene);
    killBox.position = new BABYLON.Vector3(0, -50, 0);
    killBox.visibility = 0;

    var marbleMaterialArray = [];

    //engine.displayLoadingUI();

    Promise.all([
        BABYLON.SceneLoader.AppendAsync("https://models.babylonjs.com/Marble/marble/marble.gltf"),
        BABYLON.SceneLoader.AppendAsync("https://models.babylonjs.com/Marble/marbleTower/marbleTower.gltf")
    ]).then(function () {
        var marble = scene.getMeshByName("marble");
        marble.setParent(null);
        marble.visibility = 0;

        marbleMaterialArray.push(scene.getMaterialByName("blueMat"), scene.getMaterialByName("greenMat"), scene.getMaterialByName("redMat"), scene.getMaterialByName("purpleMat"), scene.getMaterialByName("yellowMat"));
        

        // Get each mesh that's been loaded
        var tower = scene.getMeshByName("tower");
        var rockerBottom = scene.getMeshByName("rockerBottom");
        var rockerTop = scene.getMeshByName("rockerTop");
        var spinner = scene.getMeshByName("spinner");
        var supports = scene.getMeshByName("supports");
        var track = scene.getMeshByName("track");
        var wheel = scene.getMeshByName("wheel");

        // Set the parents of each mesh to null
        tower.setParent(null);
        rockerBottom.setParent(null);
        rockerTop.setParent(null);
        spinner.setParent(null);
        supports.setParent(null);
        track.setParent(null);
        wheel.setParent(null);

        // Add physics imposters to anything marbles will collide with
        tower.physicsImpostor = new BABYLON.PhysicsImpostor(tower, BABYLON.PhysicsImpostor.MeshImpostor, { mass: 0, friction: 1 }, scene);
        supports.physicsImpostor = new BABYLON.PhysicsImpostor(supports, BABYLON.PhysicsImpostor.MeshImpostor, { mass: 0, friction: 1 }, scene);
        track.physicsImpostor = new BABYLON.PhysicsImpostor(track, BABYLON.PhysicsImpostor.MeshImpostor, { mass: 0, friction: 1 }, scene);
        wheel.physicsImpostor = new BABYLON.PhysicsImpostor(wheel, BABYLON.PhysicsImpostor.MeshImpostor, { mass: 0, friction: 1 }, scene);

        // Setup the rocker

        // Create rocker pin as the phsyics root and parent loaded assets to it
        var rockerRoot = new BABYLON.Mesh("rockerRoot", scene);
        rockerBottom.setParent(rockerRoot);
        rockerTop.setParent(rockerRoot);
        rockerRoot.position = new BABYLON.Vector3(4.1, -6.4, 0);
        rockerRoot.rotation.x -= BABYLON.Tools.ToRadians(25);

        rockerTop.physicsImpostor = new BABYLON.PhysicsImpostor(rockerTop, BABYLON.PhysicsImpostor.ConvexHullImpostor, { mass: 0 }, scene);
        rockerBottom.physicsImpostor = new BABYLON.PhysicsImpostor(rockerBottom, BABYLON.PhysicsImpostor.ConvexHullImpostor, { mass: 0 }, scene);
        rockerRoot.physicsImpostor = new BABYLON.PhysicsImpostor(rockerRoot, BABYLON.PhysicsImpostor.NoImpostor, { mass: 2 }, scene);

        var rockerPin = BABYLON.MeshBuilder.CreateCylinder("Rocker", { diameter: 0.10, height: 1 }, scene);
        rockerPin.rotation.z += BABYLON.Tools.ToRadians(90);
        rockerPin.position = new BABYLON.Vector3(4.1, -6.4, 0);
        rockerPin.physicsImpostor = new BABYLON.PhysicsImpostor(rockerPin, BABYLON.PhysicsImpostor.MeshImpostor, { mass: 0 }, scene);
        rockerPin.visibility = 0;

        var joint1 = new BABYLON.HingeJoint({
            mainPivot: new BABYLON.Vector3(0, 0, 0),
            connectedPivot: new BABYLON.Vector3(0, 0, 0),
            mainAxis: new BABYLON.Vector3(-1, 0, 0),
            connectedAxis: new BABYLON.Vector3(0, 1, 0),
            nativeParams: {
            }
        });
        rockerRoot.physicsImpostor.addJoint(rockerPin.physicsImpostor, joint1);

        // Logic for the brass wind-up spinner
        var currentWindUpAngle;
        var marbleSpawnRate = 8;
        var nextMarbleSpawnAngle = 360 / marbleSpawnRate;
        var spinnerRotateSpeed = 120;
        var marblePosition = 0;

        var spinnerPivotParent = new BABYLON.TransformNode("spinnerPivotParent");
        spinner.setParent(spinnerPivotParent);

        BABYLON.Animation.CreateAndStartAnimation("spinnerRotation", spinnerPivotParent, "rotation.y", 30, spinnerRotateSpeed, BABYLON.Tools.ToRadians(0), BABYLON.Tools.ToRadians(360), 1)

        // Logic for the large wheel
        var wheelPivotParent = new BABYLON.TransformNode("wheelPivotParent");
        wheelPivotParent.position.y -= 28.8;
        wheel.setParent(wheelPivotParent);
        BABYLON.Animation.CreateAndStartAnimation("marbleTowerWheelRot", wheelPivotParent, "rotation.x", 30, 600, BABYLON.Tools.ToRadians(0), BABYLON.Tools.ToRadians(-360), 1)

        // Logic to change the starting marble position based on the rotation of the brass wind-up spinner
        scene.actionManager = new BABYLON.ActionManager(scene);
        scene.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction({
                trigger: BABYLON.ActionManager.OnEveryFrameTrigger
            },
                function () {
                    currentWindUpAngle = BABYLON.Tools.ToDegrees(spinnerPivotParent.rotation.y);
                    if (nextMarbleSpawnAngle == 360 && currentWindUpAngle < (360 / marbleSpawnRate)) {
                        nextMarbleSpawnAngle = (360 / marbleSpawnRate);
                    }
                    else if (currentWindUpAngle >= nextMarbleSpawnAngle) {
                        nextMarbleSpawnAngle += (360 / marbleSpawnRate);
                        createMarble(marblePosition);
                        marblePosition += 1;
                        if (marblePosition == 4) {
                            marblePosition = 0;
                        };

                    };
                }
            )
        );
        //engine.hideLoadingUI();
    });

    // This is a function to create marbles: creating a mesh, adding a physics imposter, and adding an event trigger
    function createMarble(spawnAngle) {
        // Create a marble (sphere) using meshbuilder
        var marble = scene.getMeshByName("marble").clone("marbleClone");
        marble.visibility = 1;
        marble.material = marbleMaterialArray[Math.floor(Math.random() * 5)];

        // Position the marble based on the incoming angle of the windup part of the marbleTower
        marble.position = marbleStartPosArray[spawnAngle];

        // Add physics to the marble
        marble.physicsImpostor = new BABYLON.PhysicsImpostor(marble, BABYLON.PhysicsImpostor.SphereImpostor, { mass: 2, friction: 0.5, restitution: 0 }, scene);

        // Add an actionManager to the marble
        marble.actionManager = new BABYLON.ActionManager(scene);

        // Register a new action with the marble's actionManager..this will execute code whenever the marble intersects the "killBox"
        marble.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction({
                trigger: BABYLON.ActionManager.OnIntersectionEnterTrigger,
                parameter: killBox
            }, function () {
                fadeAndDestroyMarble(marble);
            })
        );
    };

    function fadeAndDestroyMarble(marble) {
        BABYLON.Animation.CreateAndStartAnimation("marbleVisAnim", marble, "visibility", 30, 30, 1, 0, 0, null, () => {
            marble.dispose();
        });
    };

    return scene;
};
