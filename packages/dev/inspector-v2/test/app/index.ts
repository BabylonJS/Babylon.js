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
import "core/Helpers/sceneHelpers";
import { Color3 } from "core/Maths/math.color";
import { ArcRotateCamera } from "core/Cameras/arcRotateCamera";

import { ShowInspector } from "../../src/inspector";
import { StandardMaterial } from "core/Materials/standardMaterial";
import { MeshBuilder } from "core/Meshes";

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

    const sphere = MeshBuilder.CreateSphere("sphere1", { segments: 16, diameter: 0.2 }, scene);
    const redMat = new StandardMaterial("redMat", scene);
    redMat.emissiveColor = new Color3(1, 0, 0);
    sphere.material = redMat;
    const sphereInstance = sphere.createInstance("sphereInstance");
    sphereInstance.position = new Vector3(0, 0, -0.5);

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
