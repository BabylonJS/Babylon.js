import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { type IAccessor, type IAnimationChannelTarget, type IAnimationSampler } from "babylonjs-gltf2interface";
import { CreateTestScene, CreateTriangleGltf, ExportGltfAsync, ReadAccessor, RoundTripGltfAsync, RoundTripGltfWithBinaryAsync, ToDataUri, type GltfJson } from "./glTFTestUtils";

/** A triangle whose node is animated with translation (STEP) and scale (LINEAR) channels. */
function createAnimatedGltf(): GltfJson {
    const gltf = CreateTriangleGltf();
    const times = new Float32Array([0, 0.5, 1]);
    const translations = new Float32Array([0, 0, 0, 1, 0, 0, 1, 2, 0]);
    const scales = new Float32Array([1, 1, 1, 2, 2, 2, 3, 3, 3]);
    const base = 80;
    gltf.buffers[0].uri = ToDataUri(
        new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]),
        new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1]),
        new Uint16Array([0, 1, 2, 0]),
        times,
        translations,
        scales
    );
    gltf.buffers[0].byteLength = base + times.byteLength + translations.byteLength + scales.byteLength;
    gltf.bufferViews.push(
        { buffer: 0, byteOffset: base, byteLength: 12 },
        { buffer: 0, byteOffset: base + 12, byteLength: 36 },
        { buffer: 0, byteOffset: base + 48, byteLength: 36 }
    );
    gltf.accessors.push(
        { bufferView: 3, componentType: 5126, count: 3, type: "SCALAR" as IAccessor["type"], min: [0], max: [1] },
        { bufferView: 4, componentType: 5126, count: 3, type: "VEC3" as IAccessor["type"] },
        { bufferView: 5, componentType: 5126, count: 3, type: "VEC3" as IAccessor["type"] }
    );
    gltf.animations = [
        {
            name: "move",
            samplers: [
                { input: 3, output: 4, interpolation: "STEP" as IAnimationSampler["interpolation"] },
                { input: 3, output: 5, interpolation: "LINEAR" as IAnimationSampler["interpolation"] },
            ],
            channels: [
                { sampler: 0, target: { node: 0, path: "translation" as IAnimationChannelTarget["path"] } },
                { sampler: 1, target: { node: 0, path: "scale" as IAnimationChannelTarget["path"] } },
            ],
        },
    ];
    return gltf;
}

describe("glTF Exporter - animations", () => {
    let testScene: ReturnType<typeof CreateTestScene>;

    beforeEach(() => {
        testScene = CreateTestScene();
    });

    afterEach(() => {
        testScene.dispose();
    });

    it("round trips animation channels, interpolation modes and keyframe times", async () => {
        const { gltf, bin } = await RoundTripGltfWithBinaryAsync(testScene.scene, createAnimatedGltf());

        const animations = gltf.animations;
        if (!animations) {
            throw new Error("Expected exported animations");
        }
        expect(animations).toHaveLength(1);
        const animation = animations[0];
        if (!animation) {
            throw new Error("Expected an exported animation");
        }
        expect(animation.name).toBe("move");
        const interpolationByPath = Object.fromEntries(animation.channels.map((channel) => [channel.target.path, animation.samplers[channel.sampler].interpolation]));
        expect(interpolationByPath).toEqual({ translation: "STEP", scale: "LINEAR" });
        for (const channel of animation.channels) {
            const nodeIndex = channel.target.node;
            if (nodeIndex === undefined) {
                throw new Error("Expected animation channels to target nodes");
            }
            expect(gltf.nodes[nodeIndex].name).toBe("triangle");
            const sampler = animation.samplers[channel.sampler];
            expect(ReadAccessor(gltf, bin, sampler.input)).toEqual([0, 0.5, 1]);
            expect(ReadAccessor(gltf, bin, sampler.output)).toEqual(channel.target.path === "translation" ? [0, 0, 0, 1, 0, 0, 1, 2, 0] : [1, 1, 1, 2, 2, 2, 3, 3, 3]);
        }
    });

    it("exports only the animations accepted by shouldExportAnimation", async () => {
        await RoundTripGltfAsync(testScene.scene, createAnimatedGltf());

        const gltf = await ExportGltfAsync(testScene.scene, { shouldExportAnimation: () => false });

        expect(gltf.animations).toBeUndefined();
    });
});
