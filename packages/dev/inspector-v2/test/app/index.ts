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
import { StandardMaterial } from "core/Materials/standardMaterial";
import { MultiMaterial } from "core/Materials/multiMaterial";
import { MeshBuilder } from "core/Meshes";
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

    createMaterials();

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
