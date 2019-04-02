var meshes = [];

var addGround = function(name) {
    var ground = BABYLON.Mesh.CreateGround(name, 6, 6, 10, scene);
    ground.material = new BABYLON.StandardMaterial("gg", scene);
    ground.setVerticesData(BABYLON.VertexBuffer.UV2Kind, ground.getVerticesData(BABYLON.VertexBuffer.UVKind));
    meshes.push(ground);

    return ground;
}

var createScene = function() {
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
    light.intensity = 0;

    // Our built-in 'sphere' shape. Params: name, subdivs, size, scene
    // var sphere = BABYLON.Mesh.CreateSphere("sphere1", 16, 2, scene);
    // sphere.material = new BABYLON.StandardMaterial("gg", scene);
    // sphere.setVerticesData(BABYLON.VertexBuffer.UV2Kind, sphere.getVerticesData(BABYLON.VertexBuffer.UVKind));

    // // Move the sphere upward 1/2 its height
    // sphere.position.y = 1;
    // sphere.position.x = -2;

    // Our built-in 'ground' shape. Params: name, width, depth, subdivs, scene

    var ground = addGround("floor");

    var wall = addGround("wall");

    var ceiling = addGround("lamp");

    var ceiling2 = addGround("ceiling");

    wall.rotation.z = Math.PI / 2;
    ceiling.rotation.x = -3 * Math.PI / 4;
    ceiling.emissive = new BABYLON.Vector3(10, 10, 10);

    wall.position.x += 5;
    ceiling.position.z += 5;
    ceiling.position.y += 2.5;
    ceiling.scaling.scaleInPlace(0.25);

    ceiling2.position.y += 1.5;
    ceiling2.rotation.x = -Math.PI;

    var pr;

    var renderLoop = function() {
        if (engine.scenes.length === 0) {
            return;
        }

        if (canvas.width !== canvas.clientWidth) {
            engine.resize();
        }

        var scene = engine.scenes[0];

        if (scene.activeCamera || scene.activeCameras.length > 0) {
            scene.render();
        }

        fpsLabel.style.right = document.body.clientWidth - (jsEditor.domElement.clientWidth + canvas.clientWidth) + "px";
        fpsLabel.innerHTML = engine.getFps().toFixed() + " fps";
    }

    //ground.material.diffuseTexture = pr._patchMap;
    var fn = () => {
        pr = new BABYLON.PatchRenderer(scene);
        // var sphere = BABYLON.Mesh.CreateSphere("sphere2", 16, 2, scene);
        // sphere.position.x += 2;
        // sphere.setVerticesData(BABYLON.VertexBuffer.UV2Kind, sphere.getVerticesData(BABYLON.VertexBuffer.UVKind));

        var frameCount = 0;
        var observer;
        observer = scene.onAfterRenderTargetsRenderObservable.add(() => {
            frameCount++;
            if ((frameCount % 60) === 0) {
                engine.stopRenderLoop();
                var energyLeft = pr.gatherRadiosity();
                engine.runRenderLoop(renderLoop);

                if (!energyLeft) {
                    console.log("Converged ! ");
                    scene.onAfterRenderTargetsRenderObservable.remove(observer);
                }
            }
        });
        // setInterval(pr.gatherRadiosity.bind(pr), 1000);
    }

    var fn2 = () => {
        ground.material.emissiveTexture = ground.residualTexture.textures[4];
        wall.material.emissiveTexture = wall.residualTexture.textures[4];
        ceiling.material.emissiveTexture = ceiling.residualTexture.textures[4];
        ceiling2.material.emissiveTexture = ceiling2.residualTexture.textures[4];

        var map = ground.residualTexture;
        var size = map.getSize();
        var width = size.width;
        var height = size.height;
        var engine = scene.getEngine();
    }

    // var fn3 = () => {

    // }

    setTimeout(fn, 1000);
    setTimeout(fn2, 2000);
    // setTimeout(fn3, 3000);

    return scene;

};