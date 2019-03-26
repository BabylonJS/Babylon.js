var createScene = function () {
    // BONJOUR A TOUS
    // This creates a basic Babylon Scene object (non-mesh)
    var scene = new BABYLON.Scene(engine);

    // This creates and positions a free camera (non-mesh)
    var camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, -10), scene);

    // This targets the camera to scene origin
    camera.setTarget(BABYLON.Vector3.Zero());

    // This attaches the camera to the canvas
    camera.attachControl(canvas, true);

    // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
    var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);

    // Default intensity is 1. Let's dim the light a small amount
    light.intensity = 0.7;

    // Our built-in 'sphere' shape. Params: name, subdivs, size, scene
    var sphere = BABYLON.Mesh.CreateSphere("sphere1", 16, 2, scene);
    sphere.material = new BABYLON.StandardMaterial("gg", scene);
    sphere.setVerticesData(BABYLON.VertexBuffer.UV2Kind, sphere.getVerticesData(BABYLON.VertexBuffer.UVKind));
    console.log(sphere.getVerticesData(BABYLON.VertexBuffer.UVKind));

    // Move the sphere upward 1/2 its height
    sphere.position.y = 1;
    sphere.position.x = -2;

    // Our built-in 'ground' shape. Params: name, width, depth, subdivs, scene
    var ground = BABYLON.Mesh.CreateGround("ground1", 6, 6, 2, scene);
    ground.material = new BABYLON.StandardMaterial("gg", scene);
    ground.setVerticesData(BABYLON.VertexBuffer.UV2Kind, ground.getVerticesData(BABYLON.VertexBuffer.UVKind));
    var pr = new BABYLON.PatchRenderer(scene);
    
    ground.material.diffuseTexture = pr._patchMap;
    
    var sphere = BABYLON.Mesh.CreateSphere("sphere2", 16, 2, scene);
    sphere.position.x += 2;
    sphere.setVerticesData(BABYLON.VertexBuffer.UV2Kind, sphere.getVerticesData(BABYLON.VertexBuffer.UVKind));

    return scene;

};