import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { GLTFFileLoader } from "loaders/glTF/glTFFileLoader.pure";
import "loaders/glTF/2.0/glTFLoader";

describe("glTF 2.1 quantized positions", () => {
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

    it.each([
        { componentType: 5120, min: -128, max: 127, stride: 4 },
        { componentType: 5120, min: -128, max: -128, stride: 4 },
        { componentType: 5122, min: -32768, max: 32767, stride: 8 },
        { componentType: 5122, min: -32768, max: -32768, stride: 8 },
    ])("normalizes $componentType position bounds from $min to $max", async ({ componentType, min, max, stride }) => {
        const bytes = new Uint8Array(stride * 3);
        const view = new DataView(bytes.buffer);
        if (componentType === 5120) {
            view.setInt8(0, min);
            view.setInt8(stride, max);
            view.setInt8(stride * 2, max === min ? min : 0);
        } else {
            view.setInt16(0, min, true);
            view.setInt16(stride, max, true);
            view.setInt16(stride * 2, max === min ? min : 0, true);
        }
        const data = {
            json: {
                asset: { version: "2.1" },
                scene: 0,
                scenes: [{ nodes: [0] }],
                nodes: [{ mesh: 0 }],
                meshes: [{ primitives: [{ attributes: { POSITION: 0 } }] }],
                accessors: [{ bufferView: 0, componentType, normalized: true, count: 3, type: "VEC3", min: [min, 0, 0], max: [max, 0, 0] }],
                bufferViews: [{ buffer: 0, byteLength: bytes.length, byteStride: stride }],
                buffers: [{ byteLength: bytes.length }],
            },
            bin: { byteLength: bytes.length, readAsync: async (offset: number, length: number) => bytes.subarray(offset, offset + length) },
        };
        const result = await new GLTFFileLoader().importMeshAsync(null, scene, data, "");
        const mesh = result.meshes[1];
        expect(mesh.getVerticesData("position")![0]).toBe(-1);
        expect(mesh.getBoundingInfo().boundingBox.minimum.x).toBe(-1);
        expect(mesh.getBoundingInfo().boundingBox.maximum.x).toBe(max === min ? -1 : 1);
    });
});
