var wireframe = false;
var turntable = false;
var logfps = true;
var ibl = false;
var rtt = false;
var xr = false;
var viewports = true;

function CreateBoxAsync() {
    BABYLON.Mesh.CreateBox("box1", 0.7);
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

function CreatePlane(width, height, uvScale) {
    var positions = [];
    var normals = [];
    var uvs = [];

    var halfWidth = width / 2.0;
    var halfHeight = height / 2.0;

    // face A
    positions.push(-halfWidth, -halfHeight, 0);
    normals.push(0, 0, -1);
    uvs.push(uvScale, 0.0);

    positions.push(-halfWidth, halfHeight, 0);
    normals.push(0, 0, -1);
    uvs.push(uvScale, uvScale);

    positions.push(halfWidth, halfHeight, 0);
    normals.push(0, 0, -1.0);
    uvs.push(0.0, uvScale);

    // face B
    positions.push(-halfWidth, -halfHeight, 0);
    normals.push(0, 0, -1.0);
    uvs.push(uvScale, 0.0);

    positions.push(halfWidth, halfHeight, 0);
    normals.push(0, 0, -1.0);
    uvs.push(0.0, uvScale);

    positions.push(halfWidth, -halfHeight, 0);
    normals.push(0, 0, -1.0);
    uvs.push(0.0, 0.0);
    
    var vertexData = new BABYLON.VertexData();

    vertexData.positions = positions;
    vertexData.normals = normals;
    vertexData.uvs = uvs;
    
    var plane = new BABYLON.Mesh("Plane01", scene);
    vertexData.applyToMesh(plane, false);
    
    return plane;
}

function CreatePlanesAddressMode()
{
    let width = 5;
    let height = 5;

    let mode = [BABYLON.Texture.CLAMP_ADDRESSMODE, BABYLON.Texture.WRAP_ADDRESSMODE, BABYLON.Texture.MIRROR_ADDRESSMODE];
    for (var y = 0; y < 3; y++) {
        for (var x = 0; x < 3; x++) {
            var plane = CreatePlane(width, height, 3);
            plane.position.x = -6.0 + x * 6.0;
            plane.position.y = -6.0 + y * 6.0;

            var myMaterial = new BABYLON.StandardMaterial("myMaterial", scene);
            myMaterial.diffuseTexture = new BABYLON.Texture("https://github.com/CedricGuillemet/dump/raw/master/Custom_UV_Checker.png", scene);
            myMaterial.diffuseTexture.wrapU = mode[x];
            myMaterial.diffuseTexture.wrapV = mode[y];

            plane.material = myMaterial;
        }
    }

    return Promise.resolve();
}

function CreatePlanesFiltering()
{
    let width = 5;
    let height = 5;

    let mode = [BABYLON.Texture.CLAMP_ADDRESSMODE, BABYLON.Texture.WRAP_ADDRESSMODE, BABYLON.Texture.MIRROR_ADDRESSMODE];
    for (var y = 0; y < 2; y++) {
        for (var x = 0; x < 12; x++) {
            var plane = CreatePlane(width, height, y?0.5:2.0);
            plane.position.x = -6.0 + x * 6.0;
            plane.position.y = -6.0 + y * 6.0;

            var myMaterial = new BABYLON.StandardMaterial("myMaterial", scene);
            myMaterial.diffuseTexture = new BABYLON.Texture("https://github.com/CedricGuillemet/dump/raw/master/Custom_UV_Checker.png", scene);
            myMaterial.diffuseTexture.samplingmode  = x;

            plane.material = myMaterial;
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

//CreateBoxAsync().then(function () {
//CreatePlanesFiltering().then(function () {
//CreatePlanesAddressMode().then(function () {
//CreateSpheresAsync().then(function () {
//BABYLON.SceneLoader.AppendAsync("https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF/Box.gltf").then(function () {
//BABYLON.SceneLoader.AppendAsync("https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BoxTextured/glTF/BoxTextured.gltf").then(function () {
//BABYLON.SceneLoader.AppendAsync("https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Suzanne/glTF/Suzanne.gltf").then(function () {
//BABYLON.SceneLoader.AppendAsync("https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Avocado/glTF/Avocado.gltf").then(function () {
//BABYLON.SceneLoader.AppendAsync("https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BoomBox/glTF/BoomBox.gltf").then(function () {
BABYLON.SceneLoader.AppendAsync("https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Sponza/glTF/Sponza.gltf").then(function () {
//BABYLON.SceneLoader.AppendAsync("https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BrainStem/glTF/BrainStem.gltf").then(function () {
//BABYLON.SceneLoader.AppendAsync("https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/FlightHelmet/glTF/FlightHelmet.gltf").then(function () {
//BABYLON.SceneLoader.AppendAsync("https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/EnvironmentTest/glTF/EnvironmentTest.gltf").then(function () {
//BABYLON.SceneLoader.AppendAsync("https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BoxAnimated/glTF/BoxAnimated.gltf").then(function () {
//BABYLON.SceneLoader.AppendAsync("https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/AnimatedMorphCube/glTF/AnimatedMorphCube.gltf").then(function () {
//BABYLON.SceneLoader.AppendAsync("https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/RiggedSimple/glTF/RiggedSimple.gltf").then(function () {
//BABYLON.SceneLoader.AppendAsync("https://raw.githubusercontent.com/stevk/glTF-Asset-Generator/skins/Output/Animation_Skin/Animation_Skin_01.gltf").then(function () {
//BABYLON.SceneLoader.AppendAsync("https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/RiggedFigure/glTF/RiggedFigure.gltf").then(function () {
//BABYLON.SceneLoader.AppendAsync("https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/CesiumMan/glTF/CesiumMan.gltf").then(function () {
    BABYLON.Tools.Log("Loaded");

    if (viewports) {
        // camera positions set for sponza
        var camera1 = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(3, 2, -6), scene);
        camera1.setTarget(BABYLON.Vector3.Zero());
    
        var camera2 = new BABYLON.FreeCamera("camera2", new BABYLON.Vector3(0, 4, -10), scene);
        camera2.setTarget(BABYLON.Vector3.Zero());

        var camera3 = new BABYLON.FreeCamera("camera3", new BABYLON.Vector3(-7, 2, -0.5), scene);
        camera3.setTarget(BABYLON.Vector3.Zero());

        var camera4 = new BABYLON.FreeCamera("camera4", new BABYLON.Vector3(-4, 3, -4), scene);
        camera4.setTarget(BABYLON.Vector3.Zero());

        scene.activeCameras.push(camera1);
        scene.activeCameras.push(camera2);
        scene.activeCameras.push(camera3);
        scene.activeCameras.push(camera4);

        camera1.viewport = new BABYLON.Viewport(0, 0.5, 0.5, 0.5);
        camera2.viewport = new BABYLON.Viewport(0.5, 0.5, 0.5, 0.5);
        camera3.viewport = new BABYLON.Viewport(0, 0, 0.5, 0.5);
        camera4.viewport = new BABYLON.Viewport(0.5, 0, 0.5, 0.5);
    }
    else {
        scene.createDefaultCamera(true);
        scene.activeCamera.alpha += Math.PI;
        CreateInputHandling(scene);
    }

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

    if (xr) {
        setTimeout(function () {
            scene.createDefaultXRExperienceAsync({ disableDefaultUI: true }).then((xr) => {
                setTimeout(function () {
                    scene.meshes[0].position = scene.activeCamera.getFrontPosition(2);
                    scene.meshes[0].rotate(BABYLON.Vector3.Up(), 3.14159);
                }, 5000);
                return xr.baseExperience.enterXRAsync("immersive-vr", "unbounded", xr.renderTarget);
            });
        }, 5000);
    }
    
}, function (ex) {
    console.log(ex.message, ex.stack);
});
