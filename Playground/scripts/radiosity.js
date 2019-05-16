var meshes = [];
var texelSize = 4;

var prepareForBaking = function(mesh) {
    var scaling = mesh.scaling || new BABYLON.Vector3(1, 1, 1);
    mesh.material = new BABYLON.StandardMaterial("gg", scene);
    // mesh.material.backFaceCulling = false;
    var positions = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
    var uvs = mesh.getVerticesData(BABYLON.VertexBuffer.UVKind);
    if (!positions || !uvs) {
        return;
    }
    var indices = mesh.getIndices();

    var { uvs, textureSize } = BABYLON.Tools.WorldUniformUvScaling(positions, uvs, indices, scaling, texelSize);
    mesh.setVerticesData(BABYLON.VertexBuffer.UV2Kind, uvs);
    meshes.push(mesh);
    mesh.__lightmapSize = textureSize;
    return mesh;
}
var addGround = function(name, scaling) {
    var ground = BABYLON.Mesh.CreateGround(name, 6, 6, 1, scene);
    if (scaling) {
        ground.scaling = scaling;        
    }
    return ground;
}

var createScene = function() {
    // This creates a basic Babylon Scene object (non-mesh)
    var scene = new BABYLON.Scene(engine);

    // This creates and positions a free camera (non-mesh)
    var camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, -10), scene);
    camera.position.copyFromFloats(9.200132469205137, 1.1758180989261708, -1.4947768829435397);
    camera.rotation.copyFromFloats(-0.16352062147076044, 4.820623367259722, 0);

    // This attaches the camera to the canvas
    camera.attachControl(canvas, true);

    // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
    var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);

    // Default intensity is 1. Let's dim the light a small amount
    light.intensity = 0;

    // Our built-in 'sphere' shape. Params: name, subdivs, size, scene
    // sphere.material = new BABYLON.StandardMaterial("gg", scene);
    // sphere.setVerticesData(BABYLON.VertexBuffer.UV2Kind, sphere.getVerticesData(BABYLON.VertexBuffer.UVKind));

    // // Move the sphere upward 1/2 its height
    // sphere.position.y = 1;
    // sphere.position.x = -2;

    // Our built-in 'ground' shape. Params: name, width, depth, subdivs, scene

    // var ground = addGround("floor");

    //var wall = addGround("wall", new BABYLON.Vector3(6, 6, 6));
    // var wall2 = addGround("wall2");
    // var wall3 = addGround("wall3");
    // var wall4 = addGround("wall4");
    var lamp = addGround("lamp", new BABYLON.Vector3(0.25, 0.25, 0.25));
    // var sphere = BABYLON.Mesh.CreateSphere("sphere1", 16, 2, scene);
    // sphere.scaling.scaleInPlace(0.5);
    // sphere.position.copyFromFloats(1, 2, 0);
    // prepareForBaking(sphere);

    // var ceiling = addGround("ceiling");


    // wall.position.addInPlace(new BABYLON.Vector3(3, 2, 0));
    // wall2.position.addInPlace(new BABYLON.Vector3(-3, 2, 0));
    // wall3.position.addInPlace(new BABYLON.Vector3(0, 2, -3));
    // ground.position.addInPlace(new BABYLON.Vector3(0, -1, 0));
    // wall.rotation.addInPlace(new BABYLON.Vector3(0, 0, Math.PI / 2));
    // wall2.rotation.addInPlace(new BABYLON.Vector3(0, -Math.PI, Math.PI / 2));
    // wall3.rotation.addInPlace(new BABYLON.Vector3(0, Math.PI / 2, Math.PI / 2));

    lamp.rotation.x = -3 * Math.PI / 4;
    lamp.position.copyFromFloats(-5, 10, 5);
    lamp.color = new BABYLON.Vector3(100, 100, 100);

    // ceiling.position.y += 5;
    // ceiling.rotation.x = -Math.PI;

    var pr;
    BABYLON.SceneLoader.ImportMesh(
        "",
        "",
        "untitled.babylon",
        scene,
        (ms) => {
            for (let i = 0; i < ms.length; i++) {
                if (!ms[i].parent) {
                    ms[i].rotation.x += Math.PI / 2
                    ms[i].computeWorldMatrix(true);
                }
                //prepareForBaking(meshes[i]);
            }
            pr = new BABYLON.PatchRenderer(scene, ms, texelSize);
            pr.createHTScene(1);
            //pr._meshes = scene.meshes;
            for (let i = 0; i < scene.meshes.length; i++) {
                if (!scene.meshes[i].__lightmapSize) {
                    prepareForBaking(scene.meshes[i]);
                }
            }
        });

    for (let i = 0; i < meshes.length; i++) {
            // meshes[i].material.diffuseTexture = new BABYLON.Texture("textures/albedo.png", scene);
            meshes[i].material.emissiveColor = new BABYLON.Vector3(0.5, 0.5, 0.5);
    }

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
        pr.createMaps();
        // var sphere = BABYLON.Mesh.CreateSphere("sphere2", 16, 2, scene);
        // sphere.position.x += 2;
        // sphere.setVerticesData(BABYLON.VertexBuffer.UV2Kind, sphere.getVerticesData(BABYLON.VertexBuffer.UVKind));

        var frameCount = 0;
        var passes = 0;
        var observer;
        observer = scene.onAfterRenderTargetsRenderObservable.add(() => {
            frameCount++;
            if (true && (frameCount % 60) === 0) {
                engine.stopRenderLoop();
                var energyLeft = pr.gatherRadiosity();
                engine.runRenderLoop(renderLoop);

                if (!energyLeft || passes > 6) {
                    console.log("Converged ! ");
                    scene.onAfterRenderTargetsRenderObservable.remove(observer);
                }
                passes++;
            }
        });
        // setInterval(pr.gatherRadiosity.bind(pr), 1000);
    }

    var fn2 = () => {
        for (let i = 0; i < meshes.length; i++) {
            meshes[i].material.emissiveTexture = meshes[i].residualTexture.textures[4];
            meshes[i].material.emissiveTexture.coordinatesIndex = 1;
        }
    }

    // var fn3 = () => {

    // }

    setTimeout(fn, 2000);
    setTimeout(fn2, 3000);
    // setTimeout(fn3, 3000);

    scene.onPointerDown = (event) => {
        var pi = scene.pick(event.offsetX, event.offsetY);

        if (!pi.hit) {
            return;
        }
        console.log(pi.getTextureCoordinates());
        console.log(pi.pickedMesh);
        console.log(pi.getNormal());
    };

    return scene;
};