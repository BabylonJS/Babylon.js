import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { Vector3 } from "core/Maths/math.vector.pure";
import { GetGLTFBoundingVolume } from "loaders/glTF/2.0/glTFBoundingVolume";
import { GetMappingForKey } from "loaders/glTF/2.0/Extensions/objectModelMapping";
import { GLTFFileLoader } from "loaders/glTF/glTFFileLoader.pure";
import "loaders/glTF/2.0/glTFLoader";
import "loaders/glTF/2.0/Extensions/KHR_animation_pointer";

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

    it("preserves authored bounds on a camera node in a left-handed scene", async () => {
        scene.useRightHandedSystem = false;
        const data = {
            json: {
                asset: { version: "2.1" },
                scene: 0,
                scenes: [{ nodes: [0] }],
                nodes: [{ name: "cameraNode", camera: 0, scale: [3, 1, 1], boundingVolume: { shape: 0 } }],
                cameras: [{ type: "perspective", perspective: { yfov: 1, znear: 0.1 } }],
                shapes: [{ type: "box" }],
            },
        };
        const container = await new GLTFFileLoader().loadAssetContainerAsync(scene, data, "");
        const node = container.transformNodes.find((item) => item.name === "cameraNode")!;
        expect(GetGLTFBoundingVolume(node)!.getBoundingInfo().boundingBox.extendSizeWorld.x).toBeCloseTo(1.5);
        container.dispose();
    });

    it("keeps a skinned node's bounding volume in its authored hierarchy", async () => {
        const bytes = Buffer.concat([
            Buffer.from(new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]).buffer),
            Buffer.alloc(12),
            Buffer.from(new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0]).buffer),
            Buffer.from(new Float32Array([0, 1, 2, 0, 0, 3, 0, 0]).buffer),
        ]);
        const data = {
            json: {
                asset: { version: "2.1" },
                scene: 0,
                scenes: [{ nodes: [0] }],
                nodes: [
                    { name: "root", translation: [5, 0, 0], children: [1, 2] },
                    { name: "skinNode", mesh: 0, skin: 0, translation: [2, 0, 0], children: [3], boundingVolume: { shape: 0 } },
                    { name: "joint" },
                    { name: "child", translation: [4, 0, 0] },
                ],
                skins: [{ joints: [2] }],
                meshes: [{ primitives: [{ attributes: { POSITION: 0, JOINTS_0: 1, WEIGHTS_0: 2 } }] }],
                shapes: [{ type: "box" }],
                buffers: [{ uri: `data:application/octet-stream;base64,${bytes.toString("base64")}`, byteLength: bytes.byteLength }],
                bufferViews: [
                    { buffer: 0, byteOffset: 0, byteLength: 36 },
                    { buffer: 0, byteOffset: 36, byteLength: 12 },
                    { buffer: 0, byteOffset: 48, byteLength: 48 },
                    { buffer: 0, byteOffset: 96, byteLength: 8 },
                    { buffer: 0, byteOffset: 104, byteLength: 24 },
                ],
                accessors: [
                    { bufferView: 0, componentType: 5126, count: 3, type: "VEC3", min: [0, 0, 0], max: [1, 1, 0] },
                    { bufferView: 1, componentType: 5121, count: 3, type: "VEC4" },
                    { bufferView: 2, componentType: 5126, count: 3, type: "VEC4" },
                    { bufferView: 3, componentType: 5126, count: 2, type: "SCALAR", min: [0], max: [1] },
                    { bufferView: 4, componentType: 5126, count: 2, type: "VEC3" },
                ],
                animations: [{ samplers: [{ input: 3, output: 4 }], channels: [{ sampler: 0, target: { node: 1, path: "translation" } }] }],
            },
        };
        const pointerData = structuredClone(data);
        Object.assign(pointerData.json, { extensionsUsed: ["KHR_animation_pointer"] });
        const pointerTarget = pointerData.json.animations[0].channels[0].target;
        Reflect.deleteProperty(pointerTarget, "node");
        Object.assign(pointerTarget, { path: "pointer", extensions: { KHR_animation_pointer: { pointer: "/nodes/1/translation" } } });
        const container = await new GLTFFileLoader().loadAssetContainerAsync(scene, data, "");
        const node = container.transformNodes.find((item) => item.name === "skinNode")!;
        expect(GetGLTFBoundingVolume(node)!.getBoundingInfo().boundingBox.centerWorld.asArray()).toEqual([7, 0, 0]);
        const child = container.transformNodes.find((item) => item.name === "child")!;
        expect(child.computeWorldMatrix(true).getTranslation().x).toBe(11);
        const translation = GetMappingForKey("/nodes/{}/translation")!;
        const globalMatrix = GetMappingForKey("/nodes/{}/globalMatrix")!;
        expect(translation.getTarget(data.json.nodes[1])).toBe(node);
        expect(globalMatrix.get(data.json.nodes[1]).getTranslation().x).toBe(7);
        const mesh = container.meshes.find((item) => item.name === "skinNode")!;
        expect(mesh.computeWorldMatrix(true).getTranslation().x).toBe(5);
        translation.set!(new Vector3(3, 0, 0), data.json.nodes[1]);
        expect(GetGLTFBoundingVolume(node)!.getBoundingInfo().boundingBox.centerWorld.x).toBe(8);
        expect(mesh.computeWorldMatrix(true).getTranslation().x).toBe(5);
        translation.set!(new Vector3(2, 0, 0), data.json.nodes[1]);
        const group = container.animationGroups[0];
        group.start(false);
        group.goToFrame(group.to);
        expect(GetGLTFBoundingVolume(node)!.getBoundingInfo().boundingBox.centerWorld.asArray()).toEqual([8, 0, 0]);
        expect(child.computeWorldMatrix(true).getTranslation().x).toBe(12);
        expect(mesh.computeWorldMatrix(true).getTranslation().x).toBe(5);
        const root = container.transformNodes.find((item) => item.name === "root")!;
        root.position.x = 8;
        expect(GetGLTFBoundingVolume(node)!.getBoundingInfo().boundingBox.centerWorld.asArray()).toEqual([11, 0, 0]);
        container.dispose();

        const pointerContainer = await new GLTFFileLoader().loadAssetContainerAsync(scene, pointerData, "");
        const pointerNode = pointerContainer.transformNodes.find((item) => item.name === "skinNode")!;
        const pointerGroup = pointerContainer.animationGroups[0];
        expect(pointerGroup.targetedAnimations[0].target).toBe(pointerNode);
        pointerGroup.start(false);
        pointerGroup.goToFrame(pointerGroup.to);
        expect(GetGLTFBoundingVolume(pointerNode)!.getBoundingInfo().boundingBox.centerWorld.x).toBe(8);
        expect(
            pointerContainer.meshes
                .find((item) => item.name === "skinNode")!
                .computeWorldMatrix(true)
                .getTranslation().x
        ).toBe(5);
        pointerContainer.dispose();
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
