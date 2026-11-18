import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { Vector3 } from "core/Maths/math.vector.pure";
import { GetGLTFBoundingVolume } from "loaders/glTF/2.0/glTFBoundingVolume";
import { GLTFFileLoader } from "loaders/glTF/glTFFileLoader.pure";
import "loaders/glTF/2.0/glTFLoader";

describe("glTF 2.1 bounding volumes", () => {
    let engine: NullEngine;
    let scene: Scene;

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
        scene.useRightHandedSystem = true;
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    it("exposes a box volume in world space without changing rendering", async () => {
        const data = {
            json: {
                asset: { version: "2.1" },
                scene: 0,
                scenes: [{ nodes: [0] }],
                nodes: [
                    { name: "parent", translation: [10, 0, 0], scale: [2, 2, 2], children: [1] },
                    { name: "child", translation: [1, 0, 0], boundingVolume: { shape: 0, translation: [1, 0, 0], scale: [2, 1, 1] } },
                ],
                shapes: [{ type: "box", box: { size: [2, 4, 6] } }],
            },
        };
        const container = await new GLTFFileLoader().loadAssetContainerAsync(scene, data, "");
        const parent = container.transformNodes.find((node) => node.name === "parent")!;
        const child = container.transformNodes.find((node) => node.name === "child")!;
        expect(GetGLTFBoundingVolume(parent)).toBeUndefined();
        const volume = GetGLTFBoundingVolume(child)!;
        const bounds = volume.getBoundingInfo().boundingBox;
        expect(bounds.minimumWorld.asArray()).toEqual([10, -4, -6]);
        expect(bounds.maximumWorld.asArray()).toEqual([18, 4, 6]);
        child.position.x = 2;
        expect(volume.getBoundingInfo().boundingBox.centerWorld.asArray()).toEqual([16, 0, 0]);
        expect(container.meshes).toHaveLength(1);
    });

    it("uses shape defaults and the volume rotation for a sphere and a box", async () => {
        const data = {
            json: {
                asset: { version: "2.1" },
                scene: 0,
                scenes: [{ nodes: [0, 1] }],
                nodes: [
                    { name: "sphere", boundingVolume: { shape: 0 } },
                    { name: "box", boundingVolume: { shape: 1, rotation: [0, 0, Math.SQRT1_2, Math.SQRT1_2] } },
                ],
                shapes: [{ type: "sphere" }, { type: "box", box: { size: [2, 4, 2] } }],
            },
        };
        const container = await new GLTFFileLoader().loadAssetContainerAsync(scene, data, "");
        const sphere = GetGLTFBoundingVolume(container.transformNodes.find((node) => node.name === "sphere")!)!.getBoundingInfo().boundingBox;
        expect(sphere.minimumWorld.asArray()).toEqual([-0.5, -0.5, -0.5]);
        expect(sphere.maximumWorld.asArray()).toEqual([0.5, 0.5, 0.5]);
        const box = GetGLTFBoundingVolume(container.transformNodes.find((node) => node.name === "box")!)!.getBoundingInfo().boundingBox;
        expect(box.extendSizeWorld.x).toBeCloseTo(2);
        expect(box.extendSizeWorld.y).toBeCloseTo(1);
        expect(box.extendSizeWorld.z).toBeCloseTo(1);
    });

    it("rejects an invalid shape reference", async () => {
        const data = {
            json: {
                asset: { version: "2.1" },
                scene: 0,
                scenes: [{ nodes: [0] }],
                nodes: [{ boundingVolume: { shape: 1 } }],
                shapes: [{ type: "box" }],
            },
        };
        await expect(new GLTFFileLoader().loadAssetContainerAsync(scene, data, "")).rejects.toThrow();
    });

    it("keeps the bounding sphere conservative under a skewed world transform", async () => {
        const data = {
            json: {
                asset: { version: "2.1" },
                scene: 0,
                scenes: [{ nodes: [0] }],
                nodes: [
                    { scale: [10, 1, 1], children: [1] },
                    { name: "child", rotation: [0, 0, Math.sin(Math.PI / 8), Math.cos(Math.PI / 8)], boundingVolume: { shape: 0 } },
                ],
                shapes: [{ type: "box", box: { size: [2, 2, 2] } }],
            },
        };
        const container = await new GLTFFileLoader().loadAssetContainerAsync(scene, data, "");
        const child = container.transformNodes.find((node) => node.name === "child")!;
        const bounds = GetGLTFBoundingVolume(child)!.getBoundingInfo();
        const corner = Vector3.TransformCoordinates(new Vector3(1, -1, 1), child.computeWorldMatrix(true));
        expect(Vector3.Distance(corner, bounds.boundingSphere.centerWorld)).toBeLessThanOrEqual(bounds.boundingSphere.radiusWorld);
    });
});
