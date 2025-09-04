// NOTE: This app is an easy place to test Inspector v2.
// Additionally, here are some PGs that are helpful for testing specific features:
// Frame graphs: http://localhost:1338/?inspectorv2#9YU4C5#23
// Sprites: https://localhost:1338/?inspectorv2#YCY2IL#4
// Animation groups: http://localhost:1338/?inspectorv2#FMAYKS

import HavokPhysics from "@babylonjs/havok";
import type { Nullable } from "core/types";

import { Engine } from "core/Engines/engine";
import { LoadAssetContainerAsync } from "core/Loading/sceneLoader";
import { ParticleHelper } from "core/Particles/particleHelper";
import { Vector3 } from "core/Maths/math.vector";
import { PhysicsAggregate, PhysicsMotionType, PhysicsShapeType } from "core/Physics/v2";
import { HavokPlugin } from "core/Physics/v2/Plugins/havokPlugin";
import { Scene } from "core/scene";
import { registerBuiltInLoaders } from "loaders/dynamic";
import { ImageProcessingPostProcess } from "core/PostProcesses/imageProcessingPostProcess";
import "core/Helpers/sceneHelpers";
import { Color3, Color4 } from "core/Maths/math.color";
import { ArcRotateCamera } from "core/Cameras/arcRotateCamera";

import { ShowInspector } from "../../src/inspector";
import { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import { MeshBuilder } from "core/Meshes/meshBuilder";
import { StandardMaterial } from "core/Materials/standardMaterial";
import { MultiMaterial } from "core/Materials/multiMaterial";
import { Texture } from "core/Materials/Textures/texture";

// Register scene loader plugins.
registerBuiltInLoaders();

const canvas = document.getElementById("canvas") as HTMLCanvasElement;

const engine = new Engine(canvas, true, {
    adaptToDeviceRatio: true,
    antialias: true,
});

const scene = new Scene(engine);
(globalThis as any).scene = scene; // For debugging purposes

let camera: Nullable<ArcRotateCamera> = null;

const newSystem = ParticleHelper.CreateDefault(Vector3.Zero(), 10000, scene);
newSystem.name = "CPU particle system";
newSystem.start();

function createCamera() {
    camera?.dispose();
    scene.createDefaultCameraOrLight(true, true, true);
    camera = scene.activeCamera as ArcRotateCamera;
    camera.alpha = 1.8;
    camera.beta = 1.3;

    const camera2 = camera.clone("camera2") as ArcRotateCamera;
    camera2.alpha += Math.PI;

    const camera3 = camera.clone("camera3") as ArcRotateCamera;
    camera3.alpha += Math.PI * 0.5;
}

function createPostProcess() {
    const postProcess = new ImageProcessingPostProcess("skyPostProcess", 1.0, camera);
    postProcess.vignetteWeight = 10;
    postProcess.vignetteStretch = 2;
    postProcess.vignetteColor = new Color4(0, 0, 1, 0);
    postProcess.vignetteEnabled = true;
}

async function createPhysics() {
    const havok = await HavokPhysics();
    const hkPlugin = new HavokPlugin(true, havok);
    scene.enablePhysics(new Vector3(0, -9.81, 0), hkPlugin);
    // create kinematic convex hull for aerobatic plane
    const plane = scene.getMeshByName("aerobatic_plane.2");
    if (plane) {
        const aggregate = new PhysicsAggregate(plane, PhysicsShapeType.CONVEX_HULL, { mass: 1, restitution: 0.75 }, scene);
        aggregate.body.disablePreStep = false;
        aggregate.body.setMotionType(PhysicsMotionType.ANIMATED);
    }
}

function createTestPBRSphere() {
    const sphere = MeshBuilder.CreateSphere("pbrSphere", { diameter: 0.15 }, scene);
    sphere.position.x = -0.15;

    const glass = new PBRMaterial("glass", scene);
    glass.indexOfRefraction = 0.52;
    glass.alpha = 0.5;
    glass.directIntensity = 0.0;
    glass.environmentIntensity = 0.7;
    glass.cameraExposure = 0.66;
    glass.cameraContrast = 1.66;
    glass.microSurface = 1;
    glass.reflectivityColor = new Color3(0.2, 0.2, 0.2);
    glass.albedoColor = new Color3(0.95, 0.95, 0.95);

    sphere.material = glass;
}

function createTestBoxes() {
    const box = MeshBuilder.CreateBox("box1", { size: 0.15 }, scene);
    const redMat = new StandardMaterial("redMat", scene);
    redMat.emissiveColor = new Color3(1, 0, 0);
    redMat.diffuseTexture = new Texture("https://i.imgur.com/Wk1cGEq.png", scene);
    redMat.bumpTexture = new Texture("https://i.imgur.com/wGyk6os.png", scene);
    box.material = redMat;
    const boxInstance = box.createInstance("boxInstance");
    boxInstance.position = new Vector3(0, 0, -0.5);
}

function createTestMetadata() {
    const materialMeta = new StandardMaterial("material.meta", scene);
    materialMeta.emissiveColor = Color3.Red();
    materialMeta.metadata = {
        test: "test string",
        description: "Material JSON metadata.",
        someNumber: 73,
    };

    const defaultMeta = MeshBuilder.CreateBox("default.metadata", { size: 0.15 }, scene);

    const undefinedMeta = defaultMeta.clone("undefined.metadata");
    undefinedMeta.material = materialMeta;
    undefinedMeta.metadata = undefined;

    const jsonMeta = defaultMeta.clone("json.metadata");
    jsonMeta.material = materialMeta;
    jsonMeta.metadata = {
        test: "test string",
        description: "JSON metadata.",
        someNumber: 42,
    };

    const nullMeta = defaultMeta.clone("null.metadata");
    nullMeta.material = materialMeta;
    nullMeta.metadata = null;

    const stringMeta = defaultMeta.clone("string.metadata");
    stringMeta.material = materialMeta;
    stringMeta.metadata = "String metadata.";

    const objectMeta = defaultMeta.clone("object.metadata");
    objectMeta.material = materialMeta;
    objectMeta.metadata = jsonMeta;
}

function createMaterials() {
    const multiMaterial = new MultiMaterial("multi", scene);
    multiMaterial.subMaterials.push(...scene.materials);
}

(async () => {
    let assetContainer = await LoadAssetContainerAsync("https://assets.babylonjs.com/meshes/Demos/optimized/acrobaticPlane_variants.glb", scene);
    assetContainer.addAllToScene();
    createCamera();
    createPostProcess();

    await createPhysics();

    createTestBoxes();
    createTestPBRSphere();

    createMaterials();

    createTestMetadata();

    engine.runRenderLoop(() => {
        scene.render();
    });

    canvas.addEventListener("dragover", (event) => {
        event.preventDefault();
    });

    let isDropping = false;
    canvas.addEventListener("drop", async (event) => {
        if (!isDropping) {
            const file = event.dataTransfer?.files[0];
            if (file) {
                event.preventDefault();
                isDropping = true;
                try {
                    assetContainer.dispose();
                    assetContainer = await LoadAssetContainerAsync(file, scene);
                    assetContainer.addAllToScene();
                    createCamera();
                } finally {
                    isDropping = false;
                }
            }
        }
    });
})();

ShowInspector(scene);
