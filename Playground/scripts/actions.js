var createScene = function () {
    var scene = new BABYLON.Scene(engine);
    var camera = new BABYLON.ArcRotateCamera("Camera", 0, 0, 10, new BABYLON.Vector3(0, 0, 0), scene);
    camera.setPosition(new BABYLON.Vector3(20, 200, 400));
    camera.attachControl(canvas, true);


    camera.lowerBetaLimit = 0.1;
    camera.upperBetaLimit = (Math.PI / 2) * 0.99;
    camera.lowerRadiusLimit = 150;

    scene.clearColor = new BABYLON.Color3(0, 0, 0);

    var light1 = new BABYLON.PointLight("omni", new BABYLON.Vector3(0, 50, 0), scene);
    var light2 = new BABYLON.PointLight("omni", new BABYLON.Vector3(0, 50, 0), scene);
    var light3 = new BABYLON.PointLight("omni", new BABYLON.Vector3(0, 50, 0), scene);

    light1.diffuse = BABYLON.Color3.Red();
    light2.diffuse = BABYLON.Color3.Green();
    light3.diffuse = BABYLON.Color3.Blue();

    // Define states
    light1.state = "on";
    light2.state = "on";
    light3.state = "on";

    // Ground
    var ground = BABYLON.Mesh.CreateGround("ground", 1000, 1000, 1, scene, false);
    var groundMaterial = new BABYLON.StandardMaterial("ground", scene);
    groundMaterial.specularColor = BABYLON.Color3.Black();
    ground.material = groundMaterial;

    // Boxes
    var redBox = BABYLON.Mesh.CreateBox("red", 20, scene);
    var redMat = new BABYLON.StandardMaterial("ground", scene);
    redMat.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.4);
    redMat.specularColor = new BABYLON.Color3(0.4, 0.4, 0.4);
    redMat.emissiveColor = BABYLON.Color3.Red();
    redBox.material = redMat;
    redBox.position.x -= 100;

    var greenBox = BABYLON.Mesh.CreateBox("green", 20, scene);
    var greenMat = new BABYLON.StandardMaterial("ground", scene);
    greenMat.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.4);
    greenMat.specularColor = new BABYLON.Color3(0.4, 0.4, 0.4);
    greenMat.emissiveColor = BABYLON.Color3.Green();
    greenBox.material = greenMat;
    greenBox.position.z -= 100;

    var blueBox = BABYLON.Mesh.CreateBox("blue", 20, scene);
    var blueMat = new BABYLON.StandardMaterial("ground", scene);
    blueMat.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.4);
    blueMat.specularColor = new BABYLON.Color3(0.4, 0.4, 0.4);
    blueMat.emissiveColor = BABYLON.Color3.Blue();
    blueBox.material = blueMat;
    blueBox.position.x += 100;

    // Sphere
    var sphere = BABYLON.Mesh.CreateSphere("sphere", 16, 20, scene);
    var sphereMat = new BABYLON.StandardMaterial("ground", scene);
    sphereMat.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.4);
    sphereMat.specularColor = new BABYLON.Color3(0.4, 0.4, 0.4);
    sphereMat.emissiveColor = BABYLON.Color3.Purple();
    sphere.material = sphereMat;
    sphere.position.z += 100;

    // Rotating donut
    var donut = BABYLON.Mesh.CreateTorus("donut", 20, 8, 16, scene);

    // On pick interpolations
    var prepareButton = function (mesh, color, light) {
        var goToColorAction = new BABYLON.InterpolateValueAction(BABYLON.ActionManager.OnPickTrigger, light, "diffuse", color, 1000, null, true);

        mesh.actionManager = new BABYLON.ActionManager(scene);
        mesh.actionManager.registerAction(
            new BABYLON.InterpolateValueAction(BABYLON.ActionManager.OnPickTrigger, light, "diffuse", BABYLON.Color3.Black(), 1000))
            .then(new BABYLON.CombineAction(BABYLON.ActionManager.NothingTrigger, [ // Then is used to add a child action used alternatively with the root action. 
                goToColorAction,                                                 // First click: root action. Second click: child action. Third click: going back to root action and so on...   
                new BABYLON.SetValueAction(BABYLON.ActionManager.NothingTrigger, mesh.material, "wireframe", false)
            ]));
        mesh.actionManager.registerAction(new BABYLON.SetValueAction(BABYLON.ActionManager.OnPickTrigger, mesh.material, "wireframe", true))
            .then(new BABYLON.DoNothingAction());
        mesh.actionManager.registerAction(new BABYLON.SetStateAction(BABYLON.ActionManager.OnPickTrigger, light, "off"))
            .then(new BABYLON.SetStateAction(BABYLON.ActionManager.OnPickTrigger, light, "on"));
    }

    prepareButton(redBox, BABYLON.Color3.Red(), light1);
    prepareButton(greenBox, BABYLON.Color3.Green(), light2);
    prepareButton(blueBox, BABYLON.Color3.Blue(), light3);

    // Conditions
    sphere.actionManager = new BABYLON.ActionManager(scene);
    var condition1 = new BABYLON.StateCondition(sphere.actionManager, light1, "off");
    var condition2 = new BABYLON.StateCondition(sphere.actionManager, light1, "on");

    sphere.actionManager.registerAction(new BABYLON.InterpolateValueAction(BABYLON.ActionManager.OnLeftPickTrigger, camera, "alpha", 0, 500, condition1));
    sphere.actionManager.registerAction(new BABYLON.InterpolateValueAction(BABYLON.ActionManager.OnLeftPickTrigger, camera, "alpha", Math.PI, 500, condition2));

    // Over/Out
    var makeOverOut = function (mesh) {
        mesh.actionManager.registerAction(new BABYLON.SetValueAction(BABYLON.ActionManager.OnPointerOutTrigger, mesh.material, "emissiveColor", mesh.material.emissiveColor));
        mesh.actionManager.registerAction(new BABYLON.SetValueAction(BABYLON.ActionManager.OnPointerOverTrigger, mesh.material, "emissiveColor", BABYLON.Color3.White()));
        mesh.actionManager.registerAction(new BABYLON.InterpolateValueAction(BABYLON.ActionManager.OnPointerOutTrigger, mesh, "scaling", new BABYLON.Vector3(1, 1, 1), 150));
        mesh.actionManager.registerAction(new BABYLON.InterpolateValueAction(BABYLON.ActionManager.OnPointerOverTrigger, mesh, "scaling", new BABYLON.Vector3(1.1, 1.1, 1.1), 150));
    }

    makeOverOut(redBox);
    makeOverOut(greenBox);
    makeOverOut(blueBox);
    makeOverOut(sphere);

    // scene's actions
    scene.actionManager = new BABYLON.ActionManager(scene);

    var rotate = function (mesh) {
        scene.actionManager.registerAction(new BABYLON.IncrementValueAction(BABYLON.ActionManager.OnEveryFrameTrigger, mesh, "rotation.y", 0.01));
    }

    rotate(redBox);
    rotate(greenBox);
    rotate(blueBox);

    // Intersections
    donut.actionManager = new BABYLON.ActionManager(scene);

    donut.actionManager.registerAction(new BABYLON.SetValueAction(
        { trigger: BABYLON.ActionManager.OnIntersectionEnterTrigger, parameter: sphere },
        donut, "scaling", new BABYLON.Vector3(1.2, 1.2, 1.2)));

    donut.actionManager.registerAction(new BABYLON.SetValueAction(
        { trigger: BABYLON.ActionManager.OnIntersectionExitTrigger, parameter: sphere }
        , donut, "scaling", new BABYLON.Vector3(1, 1, 1)));

    // Animations
    var alpha = 0;
    scene.registerBeforeRender(function () {
        donut.position.x = 100 * Math.cos(alpha);
        donut.position.y = 5;
        donut.position.z = 100 * Math.sin(alpha);
        alpha += 0.01;
    });

    return scene;
}