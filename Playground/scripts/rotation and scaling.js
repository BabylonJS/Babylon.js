var createScene = function () {
    var scene = new BABYLON.Scene(engine);

    var camera = new BABYLON.ArcRotateCamera("Camera", Math.PI, Math.PI / 8, 150, BABYLON.Vector3.Zero(), scene);

    camera.attachControl(canvas, true);

    var light = new BABYLON.HemisphericLight("hemi", new BABYLON.Vector3(0, 1, 0), scene);

    //Creation of 3 boxes and 2 spheres
    var box1 = BABYLON.Mesh.CreateBox("Box1", 6.0, scene);
    var box2 = BABYLON.Mesh.CreateBox("Box2", 6.0, scene);
    var box3 = BABYLON.Mesh.CreateBox("Box3", 6.0, scene);
    var box4 = BABYLON.Mesh.CreateBox("Box4", 6.0, scene);
    var box5 = BABYLON.Mesh.CreateBox("Box5", 6.0, scene);
    var box6 = BABYLON.Mesh.CreateBox("Box6", 6.0, scene);
    var box7 = BABYLON.Mesh.CreateBox("Box7", 6.0, scene);

    //Moving boxes on the x axis
    box1.position.x = -20;
    box2.position.x = -10;
    box3.position.x = 0;
    box4.position.x = 15;
    box5.position.x = 30;
    box6.position.x = 45;

    //Rotate box around the x axis
    box1.rotation.x = Math.PI / 6;

    //Rotate box around the y axis
    box2.rotation.y = Math.PI / 3;

    //Scaling on the x axis
    box4.scaling.x = 2;

    //Scaling on the y axis
    box5.scaling.y = 2;

    //Scaling on the z axis
    box6.scaling.z = 2;

    //Moving box7 relatively to box1
    box7.parent = box1;
    box7.position.z = -10;

    return scene;
}