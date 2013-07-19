var CreateMultiMaterialScene = function(engine) {
    var scene = new BABYLON.Scene(engine);
    var camera = new BABYLON.ArcRotateCamera("Camera", 0, 0, 10, BABYLON.Vector3.Zero(), scene);
    var light = new BABYLON.PointLight("Omni", new BABYLON.Vector3(20, 100, 2), scene);
    

    var material0 = new BABYLON.StandardMaterial("mat0", scene);
    material0.diffuseColor = new BABYLON.Color3(1, 0, 0);
    material0.bumpTexture = new BABYLON.Texture("Scenes/Customs/normalMap.jpg", scene);
    
    var material1 = new BABYLON.StandardMaterial("mat1", scene);
    material1.diffuseColor = new BABYLON.Color3(0, 0, 1);
    
    var material2 = new BABYLON.StandardMaterial("mat2", scene);
    material2.emissiveColor = new BABYLON.Color3(0.4, 0, 0.4);

    var multimat = new BABYLON.MultiMaterial("multi", scene);
    multimat.subMaterials.push(material0);
    multimat.subMaterials.push(material1);
    multimat.subMaterials.push(material2);

    var sphere = BABYLON.Mesh.CreateSphere("Sphere0", 16, 3, scene);
    sphere.material = multimat;

    sphere.subMeshes = [];
    var verticesCount = sphere.getTotalVertices();
    
    sphere.subMeshes.push(new BABYLON.SubMesh(0, 0, verticesCount, 0, 900, sphere));
    sphere.subMeshes.push(new BABYLON.SubMesh(1, 0, verticesCount, 900, 900, sphere));
    sphere.subMeshes.push(new BABYLON.SubMesh(2, 0, verticesCount, 1800, 2088, sphere));

    camera.setPosition(new BABYLON.Vector3(-3, 3, 0));
    
    // Animations
    scene.registerBeforeRender(function () {
        sphere.rotation.y += 0.01;
    });

    return scene;
};