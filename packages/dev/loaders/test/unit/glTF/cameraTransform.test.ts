import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { GLTFFileLoader } from "loaders/glTF/glTFFileLoader.pure";
import "loaders/glTF/2.0/glTFLoader";

describe("glTF camera node transforms", () => {
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

    const data = () => ({
        json: {
            asset: { version: "2.0" },
            scene: 0,
            scenes: [{ nodes: [0] }],
            nodes: [
                { name: "cameraNode", camera: 0, scale: [3, 2, 1], children: [1] },
                { name: "child", translation: [1, 0, 0] },
            ],
            cameras: [{ type: "perspective", perspective: { yfov: 1, znear: 0.1 } }],
        },
    });

    it("preserves the node transform and its children in a left-handed scene", async () => {
        const container = await new GLTFFileLoader().loadAssetContainerAsync(scene, data(), "");
        const node = container.transformNodes.find((item) => item.name === "cameraNode")!;
        const child = container.transformNodes.find((item) => item.name === "child")!;
        const camera = container.cameras[0];
        expect(node.scaling.asArray()).toEqual([3, 2, 1]);
        expect(child.getAbsolutePosition().x).toBeCloseTo(-3);
        const view = camera.getViewMatrix(true).asArray();
        expect(view[0]).toBeCloseTo(-1 / 3);
        expect(view[5]).toBeCloseTo(1 / 2);
        expect(view[10]).toBeCloseTo(-1);
        node.scaling.x = 5;
        expect(child.computeWorldMatrix(true).getTranslation().x).toBeCloseTo(-5);
        scene.incrementRenderId();
        expect(camera.getViewMatrix(true).asArray()[0]).toBeCloseTo(-1 / 5);

        const correction = camera.parent!;
        expect(correction.parent).toBe(node);
        expect(container.transformNodes).toContain(correction);
        container.addAllToScene();
        expect(scene.transformNodes).toContain(correction);
        expect(scene.cameras).toContain(camera);
        container.removeAllFromScene();
        expect(scene.transformNodes).not.toContain(correction);
        expect(scene.cameras).not.toContain(camera);
        container.dispose();
        expect(correction.isDisposed()).toBe(true);
        expect(camera.isDisposed()).toBe(true);
    });

    it("keeps the existing direct camera parent in a right-handed scene", async () => {
        scene.useRightHandedSystem = true;
        const container = await new GLTFFileLoader().loadAssetContainerAsync(scene, data(), "");
        const node = container.transformNodes.find((item) => item.name === "cameraNode")!;
        expect(container.cameras[0].parent).toBe(node);
        expect(node.scaling.asArray()).toEqual([3, 2, 1]);
        expect(container.transformNodes.find((item) => item.name === "child")!.getAbsolutePosition().x).toBeCloseTo(3);
        container.dispose();
    });

    it("preserves the view of a translated and rotated camera with unit X scale", async () => {
        const fixture = {
            json: {
                ...data().json,
                nodes: [{ camera: 0, translation: [2, 3, 4], rotation: [0, Math.sin(Math.PI / 8), 0, Math.cos(Math.PI / 8)], scale: [1, 2, 3] }],
            },
        };
        const container = await new GLTFFileLoader().loadAssetContainerAsync(scene, fixture, "");
        const view = container.cameras[0].getViewMatrix(true).asArray();
        const expected = [-0.70710677, 0, 0.23570228, 0, 0, 0.5, 0, 0, -0.70710677, 0, -0.23570228, 0, 1.41421354, -1.5, 1.41421366, 1];
        expected.forEach((value, index) => expect(view[index]).toBeCloseTo(value));
        container.dispose();
    });

    it("applies animated node scales to the camera and its children", async () => {
        const values = new Float32Array([0, 1, 1, 1, 1, 4, 1, 1]);
        const container = await new GLTFFileLoader().loadAssetContainerAsync(
            scene,
            {
                json: {
                    ...data().json,
                    buffers: [{ uri: `data:application/octet-stream;base64,${Buffer.from(values.buffer).toString("base64")}`, byteLength: values.byteLength }],
                    bufferViews: [
                        { buffer: 0, byteOffset: 0, byteLength: 8 },
                        { buffer: 0, byteOffset: 8, byteLength: 24 },
                    ],
                    accessors: [
                        { bufferView: 0, componentType: 5126, count: 2, type: "SCALAR", min: [0], max: [1] },
                        { bufferView: 1, componentType: 5126, count: 2, type: "VEC3" },
                    ],
                    animations: [
                        {
                            samplers: [{ input: 0, output: 1 }],
                            channels: [{ sampler: 0, target: { node: 0, path: "scale" } }],
                        },
                    ],
                },
            },
            ""
        );
        const group = container.animationGroups[0];
        group.start(false);
        group.goToFrame(group.to);
        const node = container.transformNodes.find((item) => item.name === "cameraNode")!;
        const child = container.transformNodes.find((item) => item.name === "child")!;
        expect(node.scaling.x).toBeCloseTo(4);
        expect(child.computeWorldMatrix(true).getTranslation().x).toBeCloseTo(-4);
        scene.incrementRenderId();
        expect(container.cameras[0].getViewMatrix(true).asArray()[0]).toBeCloseTo(-0.25);
        container.dispose();
    });
});
