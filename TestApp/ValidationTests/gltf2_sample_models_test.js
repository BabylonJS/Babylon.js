var baseUrl = "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/[MODEL_NAME]/glTF/[MODEL_NAME].gltf";
var models = [
    "2CylinderEngine",
    "AlphaBlendModeTest",
    "AnimatedCube",
    "AnimatedMorphCube",
    "AnimatedMorphSphere",
    "AnimatedTriangle",
    // "AntiqueCamera", TODO https://microsoft.visualstudio.com/OS/_workitems/edit/20335970
    "Avocado",
    "BarramundiFish",
    "BoomBox",
    "BoomBoxWithAxes",
    "Box",
    "BoxAnimated",
    "BoxInterleaved",
    "BoxTextured",
    "BoxTexturedNonPowerOfTwo",
    "BoxVertexColors",
    "BrainStem",
    "Buggy",
    "Cameras",
    "CesiumMan",
    "CesiumMilkTruck",
    "Corset",
    "Cube",
    "DamagedHelmet",
    "Duck",
    "FlightHelmet",
    "GearboxAssy",
    "Lantern",
    "MetalRoughSpheres",
    "Monster",
    "MorphPrimitivesTest",
    "MultiUVTest",
    "NormalTangentMirrorTest",
    "NormalTangentTest",
    "OrientationTest",
    "ReciprocatingSaw",
    "RiggedFigure",
    "RiggedSimple",
    "SciFiHelmet",
    "SimpleMeshes",
    "SimpleMorph",
    "SimpleSparseAccessor",
    "SpecGlossVsMetalRough",
    "Sponza",
    "Suzanne",
    "TextureCoordinateTest",
    "TextureSettingsTest",
    "TextureTransformTest",
    "Triangle",
    "TriangleWithoutIndices",
    "TwoSidedPlane",
    "VC",
    "VertexColorTest",
    "WaterBottle"
];

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

var currentMesh;

function loadItem(index, scene) {
    if (scene.isDisposed) {
        return;
    }

    BABYLON.SceneLoader.ImportMeshAsync("", baseUrl.replace(/\[MODEL_NAME\]/g, models[index])).then(function (result) {
        if (currentMesh) {
            currentMesh.dispose(false, true);
        }

        currentMesh = result.meshes[0];

        scene.createDefaultCamera(true, true, true);
        scene.activeCamera.alpha += Math.PI;

        if (index < models.length - 1) {
            setTimeout(function () {
                loadItem(index + 1, scene);
            }, 2000);
        }
    });
}

function createScene() {
    var scene = new BABYLON.Scene(engine);
    scene.createDefaultCameraOrLight();
    CreateInputHandling(scene);

    loadItem(0, scene);

    return scene;
}
