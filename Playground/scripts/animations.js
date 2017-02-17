var createScene = function () {
    var scene = new BABYLON.Scene(engine);

    var light = new BABYLON.PointLight("Omni", new BABYLON.Vector3(0, 100, 100), scene);
    var camera = new BABYLON.ArcRotateCamera("Camera", 0, 0.8, 100, new BABYLON.Vector3.Zero(), scene);
    camera.attachControl(canvas, true);

    //Boxes
    var box1 = BABYLON.Mesh.CreateBox("Box1", 10.0, scene);
    box1.position.x = -20;
    var box2 = BABYLON.Mesh.CreateBox("Box2", 10.0, scene);

    var materialBox = new BABYLON.StandardMaterial("texture1", scene);
    materialBox.diffuseColor = new BABYLON.Color3(0, 1, 0);//Green
    var materialBox2 = new BABYLON.StandardMaterial("texture2", scene);

    //Applying materials
    box1.material = materialBox;
    box2.material = materialBox2;

    //Positioning box
    box2.position.x = 20;

    // Creation of a basic animation with box 1
    //----------------------------------------

    //Create a scaling animation at 30 FPS
    var animationBox = new BABYLON.Animation("tutoAnimation", "scaling.x", 30, BABYLON.Animation.ANIMATIONTYPE_FLOAT,
                                                                    BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
    //Here we have chosen a loop mode, but you can change to :
    //  Use previous values and increment it (BABYLON.Animation.ANIMATIONLOOPMODE_RELATIVE)
    //  Restart from initial value (BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE)
    //  Keep the final value (BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT)

    // Animation keys
    var keys = [];
    //At the animation key 0, the value of scaling is "1"
    keys.push({
        frame: 0,
        value: 1
    });

    //At the animation key 20, the value of scaling is "0.2"
    keys.push({
        frame: 20,
        value: 0.2
    });

    //At the animation key 100, the value of scaling is "1"
    keys.push({
        frame: 100,
        value: 1
    });

    //Adding keys to the animation object
    animationBox.setKeys(keys);

    //Then add the animation object to box1
    box1.animations.push(animationBox);

    //Finally, launch animations on box1, from key 0 to key 100 with loop activated
    scene.beginAnimation(box1, 0, 100, true);

    // Creation of a manual animation with box 2
    //------------------------------------------
    scene.registerBeforeRender(function () {

        //The color is defined at run time with random()
        box2.material.diffuseColor = new BABYLON.Color3(Math.random(), Math.random(), Math.random());

    });

    return scene;
}