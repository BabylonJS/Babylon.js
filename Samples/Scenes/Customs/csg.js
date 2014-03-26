var CreateCSGTestScene = function (engine) {
    var scene = new BABYLON.Scene(engine);
    var light = new BABYLON.DirectionalLight("dir01", new BABYLON.Vector3(0, -0.5, -1.0), scene);
    var camera = new BABYLON.ArcRotateCamera("Camera", 0, 0, 10, new BABYLON.Vector3(0, 0, 0), scene);
    camera.setPosition(new BABYLON.Vector3(10, 10, 10));
    light.position = new BABYLON.Vector3(20, 150, 70);
    camera.minZ = 10.0;

    scene.ambientColor = new BABYLON.Color3(0.3, 0.3, 0.3);

    var sourceMat = new BABYLON.StandardMaterial("sourceMat", scene);
    sourceMat.wireframe = true;
    sourceMat.backFaceCulling = false;

    var a = BABYLON.Mesh.CreateSphere("sphere", 16, 4, scene);
    var b = BABYLON.Mesh.CreateBox("box", 4, scene);
    var c = BABYLON.Mesh.CreateBox("box", 4, scene);

    a.material = sourceMat;
    b.material = sourceMat;
    c.material = sourceMat;

    a.position.y += 5;
    b.position.y += 2.5;
    c.position.y += 3.5;
    c.rotation.y += Math.PI / 8.0;

    var aCSG = BABYLON.CSG.FromMesh(a);
    var bCSG = BABYLON.CSG.FromMesh(b);
    var cCSG = BABYLON.CSG.FromMesh(c);

    // Set up a MultiMaterial
    var mat0 = new BABYLON.StandardMaterial("mat0", scene);
    var mat1 = new BABYLON.StandardMaterial("mat1", scene);

    mat0.diffuseColor.copyFromFloats(0.8, 0.2, 0.2);
    mat0.backFaceCulling = false;

    mat1.diffuseColor.copyFromFloats(0.2, 0.8, 0.2);
    mat1.backFaceCulling = false;

    var subCSG = bCSG.subtract(aCSG);
    var newMesh = subCSG.toMesh("csg", mat0, scene);
    newMesh.position = new BABYLON.Vector3(-10, 0, 0);

    subCSG = aCSG.subtract(bCSG);
    newMesh = subCSG.toMesh("csg2", mat0, scene);
    newMesh.position = new BABYLON.Vector3(10, 0, 0);

    subCSG = aCSG.intersect(bCSG);
    newMesh = subCSG.toMesh("csg3", mat0, scene);
    newMesh.position = new BABYLON.Vector3(0, 0, 10);

    // Submeshes are built in order : mat0 will be for the first cube, and mat1 for the second
    var multiMat = new BABYLON.MultiMaterial("multiMat", scene);
    multiMat.subMaterials.push(mat0, mat1);

    // Last parameter to true means you want to build 1 subMesh for each mesh involved
    subCSG = bCSG.subtract(cCSG);
    newMesh = subCSG.toMesh("csg4", multiMat, scene, true);
    newMesh.position = new BABYLON.Vector3(0, 0, -10);

    return scene;
};