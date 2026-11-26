import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { FreeCamera } from "core/Cameras/freeCamera";
import { type Engine } from "core/Engines/engine";
import { NullEngine } from "core/Engines/nullEngine";
import { Vector3 } from "core/Maths/math.vector";
import { TransformNode } from "core/Meshes/transformNode";
import { Scene } from "core/scene";

describe("TransformNode billboard", () => {
    let engine: Engine;
    let scene: Scene;

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    const worldXAxis = (camera: FreeCamera, node: TransformNode, pitch: number) => {
        camera.rotation.x = pitch;
        camera.getViewMatrix(true);
        const axis = Vector3.TransformNormal(Vector3.Right(), node.computeWorldMatrix(true));
        return axis.normalize();
    };

    it("does not flip a Z billboard when an up-vector camera crosses the vertical", () => {
        const camera = new FreeCamera("camera", Vector3.Zero(), scene);
        camera.updateUpVectorFromRotation = true;
        scene.activeCamera = camera;

        const node = new TransformNode("node", scene);
        node.position.set(0, 0, 5);
        node.billboardMode = TransformNode.BILLBOARDMODE_Z;

        const degrees = Math.PI / 180;
        const below = worldXAxis(camera, node, 89.99 * degrees);
        const above = worldXAxis(camera, node, 90.01 * degrees);
        expect(Vector3.Dot(below, above)).toBeCloseTo(1, 6);
    });
});
