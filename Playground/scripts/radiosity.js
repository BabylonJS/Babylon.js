var meshes = [];
var texelSize = 4;
var worldToTexelRatio = 0.25; // 1 texel for this amount of m

let uvm = new BABYLON.UvMapper();

var prepareUVS = function(ms) {
    let geometryMeshes = [];
    for (let i = 0; i < ms.length; i++) {
        if (ms[i].getVerticesData(BABYLON.VertexBuffer.PositionKind)); {
            geometryMeshes.push(ms[i]);
        }
    }

    let factor = uvm.map(geometryMeshes);

    for (let i = 0; i < geometryMeshes.length; i++) {
        let mesh = geometryMeshes[i];
        mesh.__lightmapSize = 1 / factor / worldToTexelRatio;
        mesh.__lightmapSize = Math.max(1, BABYLON.Tools.FloorPOT(mesh.__lightmapSize));
        console.log(mesh.__lightmapSize);
        meshes.push(mesh);
    }
}

var addMaterial = function(mesh) {
    mesh.material = new BABYLON.StandardMaterial("gg", scene);
    // mesh.material.diffuseColor = new BABYLON.Color3(1, 1, 1);
    // mesh.material.backFaceCulling = false;
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

    var lamp =/*BABYLON.Mesh.CreateSphere("sphere1", 16, 2, scene);*/addGround("lamp", new BABYLON.Vector3(0.25, 0.25, 0.25));

    lamp.rotation.x = -3 * Math.PI / 4;
    lamp.position.copyFromFloats(-5, 10, 10);
    lamp.color = new BABYLON.Vector3(50, 50, 50);

    addMaterial(lamp);
    prepareUVS([lamp]);

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
                addMaterial(ms[i]);
            }
            prepareUVS(ms);

            pr = new BABYLON.PatchRenderer(scene, ms, texelSize);
            pr._meshes = meshes;
        }
    );

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

        var frameCount = 0;
        var passes = 0;
        var observer;
        observer = scene.onAfterRenderTargetsRenderObservable.add(() => {
            frameCount++;
            if (true && (frameCount % 60) === 0) {
                engine.stopRenderLoop();
                var energyLeft = pr.gatherRadiosity(true);
                engine.runRenderLoop(renderLoop);

                if (!energyLeft || passes > 6) {
                    console.log("Converged ! ");
                    scene.onAfterRenderTargetsRenderObservable.remove(observer);
                }
                passes++;
            }
        });
    }

    var fn2 = () => {
        for (let i = 0; i < meshes.length; i++) {
            meshes[i].material.emissiveTexture = meshes[i].residualTexture.textures[4];
            meshes[i].material.emissiveTexture.coordinatesIndex = 1;
        }
    }

    setTimeout(fn, 2000);
    setTimeout(fn2, 3000);

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