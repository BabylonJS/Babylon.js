import type { ArcRotateCamera, Nullable } from "core/index";

import HavokPhysics from "@babylonjs/havok";

import { Engine } from "core/Engines/engine";
import { LoadAssetContainerAsync } from "core/Loading/sceneLoader";
import { Vector3 } from "core/Maths/math.vector";
import { PhysicsAggregate, PhysicsMotionType, PhysicsShapeType } from "core/Physics/v2";
import { HavokPlugin } from "core/Physics/v2/Plugins/havokPlugin";
import { Scene } from "core/scene";
import { registerBuiltInLoaders } from "loaders/dynamic";

import { ShowInspector } from "../../src/inspector";

import "core/Helpers/sceneHelpers";

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

function createCamera() {
    camera?.dispose();
    scene.createDefaultCameraOrLight(true, true, true);
    camera = scene.activeCamera as ArcRotateCamera;
    camera.alpha = Math.PI / 2;
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

(async () => {
    let assetContainer = await LoadAssetContainerAsync("https://assets.babylonjs.com/meshes/Demos/optimized/acrobaticPlane_variants.glb", scene);
    assetContainer.addAllToScene();
    createCamera();
    await createPhysics();

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
