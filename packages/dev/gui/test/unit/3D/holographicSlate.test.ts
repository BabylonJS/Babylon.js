import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { FreeCamera } from "core/Cameras/freeCamera";
import { NullEngine } from "core/Engines/nullEngine";
import { Quaternion, Vector3 } from "core/Maths/math.vector";
import { Mesh } from "core/Meshes/mesh";
import { Scene } from "core/scene";
import { HolographicSlate } from "gui/3D/controls/holographicSlate";
import { GUI3DManager } from "gui/3D/gui3DManager";
import { SlateGizmo } from "gui/3D/gizmos/slateGizmo";

describe.each([false, true])("HolographicSlate reset pose (RH=%s)", (isRightHanded) => {
    let engine: NullEngine;
    let scene: Scene;
    let manager: GUI3DManager;
    let slate: HolographicSlate;

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
        scene.useRightHandedSystem = isRightHanded;
        manager = new GUI3DManager(scene);
        manager.utilityLayer!.utilityLayerScene.useRightHandedSystem = isRightHanded;
        slate = new HolographicSlate("slate");
        slate._host = manager;
        // Isolate resetDefaultAspectAndPose from content textures and browser-only GUI setup.
        slate["_node"] = new Mesh("slateNode", manager.utilityLayer!.utilityLayerScene);
        slate._gizmo = new SlateGizmo(manager.utilityLayer!);
    });

    afterEach(() => {
        slate._gizmo.dispose();
        slate.node!.dispose();
        manager.dispose();
        scene.dispose();
        engine.dispose();
    });

    it.each([0, 0.7])("places the slate in front of the camera with its local -Z front facing the camera (yaw=%s)", (yaw) => {
        const camera = new FreeCamera("camera", new Vector3(2, 1, 3), scene);
        camera.rotationQuaternion = Quaternion.RotationYawPitchRoll(yaw, 0, 0);
        manager.utilityLayer!.utilityLayerScene.activeCamera = camera;
        const cameraForward = Vector3.TransformNormal(Vector3.Forward(isRightHanded), camera.getWorldMatrix());

        slate.resetDefaultAspectAndPose(false);

        const expectedPosition = camera.position.add(cameraForward);
        expect(slate.node!.position.x).toBeCloseTo(expectedPosition.x);
        expect(slate.node!.position.y).toBeCloseTo(expectedPosition.y);
        expect(slate.node!.position.z).toBeCloseTo(expectedPosition.z);
        const front = Vector3.Backward().rotateByQuaternionToRef(slate.node!.rotationQuaternion!, new Vector3());
        expect(Vector3.Dot(front, camera.position.subtract(slate.node!.position).normalize())).toBeCloseTo(1);

        slate.node!.position.set(5, 2, 7);
        slate.resetDefaultAspectAndPose(false);
        expect(slate.node!.position.equalsToFloats(5, 2, 7)).toBe(true);
    });
});
