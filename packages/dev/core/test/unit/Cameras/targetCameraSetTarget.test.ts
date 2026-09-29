import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { TargetCamera } from "core/Cameras/targetCamera";
import { NullEngine } from "core/Engines/nullEngine";
import { Vector3 } from "core/Maths/math.vector";
import { Scene } from "core/scene";

describe("TargetCamera.setTarget", () => {
    let engine: NullEngine;
    let scene: Scene;

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    it("recovers after a coincident target is replaced by a valid target", () => {
        const camera = new TargetCamera("camera", Vector3.Zero(), scene);

        camera.setTarget(new Vector3(0, 0, 10));
        camera.getViewMatrix(true);
        expect(camera.getTarget().z).toBeCloseTo(10);

        camera.setTarget(camera.position.clone());
        camera.getViewMatrix(true);

        camera.setTarget(new Vector3(10, 0, 0));
        camera.getViewMatrix(true);
        expect(camera.getTarget().x).toBeCloseTo(10);
        expect(camera.getTarget().subtract(camera.position).length()).toBeGreaterThan(0);
    });

    it("keeps the last valid view direction while the target is coincident", () => {
        const camera = new TargetCamera("camera", Vector3.Zero(), scene);

        camera.setTarget(new Vector3(0, 0, 10));
        camera.getViewMatrix(true);
        camera.setTarget(camera.position.clone());
        camera.getViewMatrix(true);

        expect(camera.getTarget().z).toBeCloseTo(10);
    });
});
