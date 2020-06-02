var wireframe = false;
var turntable = false;
var logfps = true;
var ibl = false;
var rtt = false;
var vr = false;
var ar = false;
var xrHitTest = false;
var text = false;

function CreateBoxAsync() {
    BABYLON.Mesh.CreateBox("box1", 0.2);
    return Promise.resolve();
}

function CreateSpheresAsync() {
    var size = 12;
    for (var i = 0; i < size; i++) {
        for (var j = 0; j < size; j++) {
            for (var k = 0; k < size; k++) {
                var sphere = BABYLON.Mesh.CreateSphere("sphere" + i + j + k, 32, 0.9, scene);
                sphere.position.x = i;
                sphere.position.y = j;
                sphere.position.z = k;
            }
        }
    }

    return Promise.resolve();
}

function CreateInputHandling(scene) {
    var inputManager = new InputManager();
    var priorX = inputManager.pointerX;
    var priorY = inputManager.pointerY;
    var x = 0;
    var y = 0;
    scene.onBeforeRenderObservable.add(function () {
        x = inputManager.pointerX;
        y = inputManager.pointerY;

        if (inputManager.isPointerDown) {
            scene.activeCamera.alpha += 0.01 * (priorX - x);
            scene.activeCamera.beta += 0.01 * (priorY - y);
        }

        priorX = x;
        priorY = y;
    });
}

var engine = new BABYLON.NativeEngine();
var scene = new BABYLON.Scene(engine);

CreateBoxAsync().then(function () {
//CreateSpheresAsync().then(function () {
//BABYLON.SceneLoader.AppendAsync("https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF/Box.gltf").then(function () {
//BABYLON.SceneLoader.AppendAsync("https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BoxTextured/glTF/BoxTextured.gltf").then(function () {
//BABYLON.SceneLoader.AppendAsync("https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Suzanne/glTF/Suzanne.gltf").then(function () {
//BABYLON.SceneLoader.AppendAsync("https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Avocado/glTF/Avocado.gltf").then(function () {
//BABYLON.SceneLoader.AppendAsync("https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BoomBox/glTF/BoomBox.gltf").then(function () {
//BABYLON.SceneLoader.AppendAsync("https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Sponza/glTF/Sponza.gltf").then(function () {
//BABYLON.SceneLoader.AppendAsync("https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BrainStem/glTF/BrainStem.gltf").then(function () {
//BABYLON.SceneLoader.AppendAsync("https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/FlightHelmet/glTF/FlightHelmet.gltf").then(function () {
//BABYLON.SceneLoader.AppendAsync("https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/EnvironmentTest/glTF/EnvironmentTest.gltf").then(function () {
//BABYLON.SceneLoader.AppendAsync("https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BoxAnimated/glTF/BoxAnimated.gltf").then(function () {
//BABYLON.SceneLoader.AppendAsync("https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/AnimatedMorphCube/glTF/AnimatedMorphCube.gltf").then(function () {
//BABYLON.SceneLoader.AppendAsync("https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/RiggedSimple/glTF/RiggedSimple.gltf").then(function () {
//BABYLON.SceneLoader.AppendAsync("https://raw.githubusercontent.com/stevk/glTF-Asset-Generator/skins/Output/Animation_Skin/Animation_Skin_01.gltf").then(function () {
//BABYLON.SceneLoader.AppendAsync("https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/RiggedFigure/glTF/RiggedFigure.gltf").then(function () {
//BABYLON.SceneLoader.AppendAsync("https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/CesiumMan/glTF/CesiumMan.gltf").then(function () {
//BABYLON.SceneLoader.AppendAsync("https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/ClearCoatTest/glTF/ClearCoatTest.gltf").then(function () {
    BABYLON.Tools.Log("Loaded");

    scene.createDefaultCamera(true);
    scene.activeCamera.alpha += Math.PI;
    CreateInputHandling(scene);

    if (ibl) {
        scene.createDefaultEnvironment({ createGround: false, createSkybox: false });
    }
    else {
        scene.createDefaultLight(true);
    }

    if (wireframe) {
        var material = new BABYLON.StandardMaterial("wireframe", scene);
        material.wireframe = true;
        material.pointsCloud = true;

        for (var index = 0; index < scene.meshes.length; index++) {
            scene.meshes[0].material = material;
        }
    }

    if (rtt) {
        var rttTexture = new BABYLON.RenderTargetTexture("rtt", 1024, scene);
        scene.meshes.forEach(mesh => {
            rttTexture.renderList.push(mesh);
        });
        rttTexture.activeCamera = scene.activeCamera;
        rttTexture.vScale = -1;

        scene.customRenderTargets.push(rttTexture);

        var rttMaterial = new BABYLON.StandardMaterial("rttMaterial", scene);
        rttMaterial.diffuseTexture = rttTexture;

        var plane = BABYLON.MeshBuilder.CreatePlane("rttPlane", { width: 4, height: 4 }, scene);
        plane.position.y = 1;
        plane.position.z = -5;
        plane.rotation.y = Math.PI;
        plane.material = rttMaterial;
    }

    if (turntable) {
        scene.beforeRender = function () {
            scene.meshes[0].rotate(BABYLON.Vector3.Up(), 0.005 * scene.getAnimationRatio());
        };
    }

    if (logfps) {
        var logFpsLoop = function () {
            BABYLON.Tools.Log("FPS: " + Math.round(engine.getFps()));
            window.setTimeout(logFpsLoop, 1000);
        };

        window.setTimeout(logFpsLoop, 3000);
    }

    engine.runRenderLoop(function () {
        scene.render();
    });

    if (vr || ar) {
        setTimeout(function () {
            scene.createDefaultXRExperienceAsync({ disableDefaultUI: true, disableTeleportation: true }).then((xr) => {
                if (xrHitTest) {
                    const xrHitTestModule = xr.baseExperience.featuresManager.enableFeature(
                        BABYLON.WebXRFeatureName.HIT_TEST,
                        "latest",
                         {offsetRay: {origin: {x: 0, y: 0, z: 0}, direction: {x: 0, y: 0, z: -1}}});

                    xrHitTestModule.onHitTestResultObservable.add((results) => {
                        if (results.length) {
                            scene.meshes[0].position.x = results[0].position.x;
                            scene.meshes[0].position.y = results[0].position.y;
                            scene.meshes[0].position.z = results[0].position.z;
                        }
                    });
                }
                else {
                    setTimeout(function () {
                        scene.meshes[0].position = scene.activeCamera.getFrontPosition(2);
                        scene.meshes[0].rotate(BABYLON.Vector3.Up(), 3.14159);
                    }, 5000);
                }

                xr.baseExperience.enterXRAsync(vr ? "immersive-vr" : "immersive-ar", "unbounded", xr.renderTarget);
            });
        }, 5000);
    }

    if (text) {
        var Writer = BABYLON.MeshWriter(scene, { scale: 1.0, defaultFont: "Arial" });
        new Writer(
            "Lorem ipsum dolor sit amet...",
            {
                "anchor": "center",
                "letter-height": 5,
                "color": "#FF0000"
            }
        );
    }
    
}, function (ex) {
    console.log(ex.message, ex.stack);
});
