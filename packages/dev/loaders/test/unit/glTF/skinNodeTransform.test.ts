import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { Vector3 } from "core/Maths/math.vector.pure";
import { GetMappingForKey } from "loaders/glTF/2.0/Extensions/objectModelMapping";
import { GLTFFileLoader } from "loaders/glTF/glTFFileLoader.pure";
import "loaders/glTF/2.0/glTFLoader";
import "loaders/glTF/2.0/Extensions/KHR_animation_pointer";

describe("glTF skinned node transforms", () => {
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

    it.each([
        [false, "sibling"],
        [false, "self"],
        [false, "child"],
        [true, "sibling"],
        [true, "self"],
        [true, "child"],
    ])("preserves the node hierarchy with pointer animation %s and joint %s", async (pointerAnimation, jointLocation) => {
        const bytes = Buffer.concat([
            Buffer.from(new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]).buffer),
            Buffer.alloc(12),
            Buffer.from(new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0]).buffer),
            Buffer.from(new Float32Array([0, 1, 2, 0, 0, 3, 0, 0]).buffer),
        ]);
        const data = {
            json: {
                asset: { version: "2.0" },
                scene: 0,
                scenes: [{ nodes: [0] }],
                nodes: [
                    { name: "root", translation: [5, 0, 0], children: jointLocation === "child" ? [1] : [1, 2] },
                    { name: "skinNode", mesh: 0, skin: 0, translation: [2, 0, 0], children: jointLocation === "child" ? [3, 2] : [3] },
                    { name: "joint" },
                    { name: "child", translation: [4, 0, 0] },
                ],
                skins: [jointLocation === "self" ? { joints: [1], skeleton: 1 } : { joints: [2], skeleton: 2 }],
                meshes: [{ primitives: [{ attributes: { POSITION: 0, JOINTS_0: 1, WEIGHTS_0: 2 } }] }],
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
        if (pointerAnimation) {
            Object.assign(data.json, { extensionsUsed: ["KHR_animation_pointer"] });
            const target = data.json.animations[0].channels[0].target;
            Reflect.deleteProperty(target, "node");
            Object.assign(target, { path: "pointer", extensions: { KHR_animation_pointer: { pointer: "/nodes/1/translation" } } });
        }

        const unskinnedData = structuredClone(data);
        const container = await new GLTFFileLoader().loadAssetContainerAsync(scene, data, "");
        const node = container.transformNodes.find((item) => item.name === "skinNode")!;
        const child = container.transformNodes.find((item) => item.name === "child")!;
        const mesh = container.meshes.find((item) => item.name === "skinNode")!;
        const translation = GetMappingForKey("/nodes/{}/translation")!;
        const globalMatrix = GetMappingForKey("/nodes/{}/globalMatrix")!;

        expect(node.computeWorldMatrix(true).getTranslation().x).toBe(7);
        expect(child.computeWorldMatrix(true).getTranslation().x).toBe(11);
        expect(mesh.computeWorldMatrix(true).getTranslation().x).toBe(5);
        expect(translation.getTarget(data.json.nodes[1])).toBe(node);
        expect(globalMatrix.get(data.json.nodes[1]).getTranslation().x).toBe(7);
        translation.set!(new Vector3(3, 0, 0), data.json.nodes[1]);
        expect(child.computeWorldMatrix(true).getTranslation().x).toBe(12);
        expect(mesh.computeWorldMatrix(true).getTranslation().x).toBe(5);
        translation.set!(new Vector3(2, 0, 0), data.json.nodes[1]);

        const group = container.animationGroups[0];
        expect(group.targetedAnimations[0].target).toBe(node);
        group.start(false);
        group.goToFrame(group.to);
        expect(child.computeWorldMatrix(true).getTranslation().x).toBe(12);
        expect(mesh.computeWorldMatrix(true).getTranslation().x).toBe(5);
        if (jointLocation === "self") {
            expect(container.skeletons[0].bones[0].getTransformNode()).toBe(node);
        } else if (jointLocation === "child") {
            const joint = container.transformNodes.find((item) => item.name === "joint")!;
            expect(container.skeletons[0].bones[0].getTransformNode()).toBe(joint);
            expect(joint.computeWorldMatrix(true).getTranslation().x).toBe(8);
        }
        container.dispose();

        const loader = new GLTFFileLoader();
        loader.loadSkins = false;
        const unskinned = await loader.loadAssetContainerAsync(scene, unskinnedData, "");
        expect(
            unskinned.meshes
                .find((item) => item.name === "skinNode")!
                .computeWorldMatrix(true)
                .getTranslation().x
        ).toBe(7);
        expect(
            unskinned.transformNodes
                .find((item) => item.name === "child")!
                .computeWorldMatrix(true)
                .getTranslation().x
        ).toBe(11);
        expect(unskinned.skeletons).toHaveLength(0);
        unskinned.dispose();
    });
});
