import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CreateTestScene, ExportGltfAsync, RoundTripGltfAsync, ToDataUri, type GltfJson, CreateTriangleGltf } from "./glTFTestUtils";

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
        { bufferView: 3, componentType: 5126, count: 3, type: "SCALAR", min: [0], max: [1] },
        { bufferView: 4, componentType: 5126, count: 3, type: "VEC3" },
        { bufferView: 5, componentType: 5126, count: 3, type: "VEC3" }
    );
    gltf.animations = [
        {
            name: "move",
            samplers: [
                { input: 3, output: 4, interpolation: "STEP" },
                { input: 3, output: 5, interpolation: "LINEAR" },
            ],
            channels: [
                { sampler: 0, target: { node: 0, path: "translation" } },
                { sampler: 1, target: { node: 0, path: "scale" } },
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
        const gltf = await RoundTripGltfAsync(testScene.scene, createAnimatedGltf());

        expect(gltf.animations).toHaveLength(1);
        const animation = gltf.animations[0];
        expect(animation.name).toBe("move");
        const interpolationByPath = Object.fromEntries(animation.channels.map((c: GltfJson) => [c.target.path, animation.samplers[c.sampler].interpolation]));
        expect(interpolationByPath).toEqual({ translation: "STEP", scale: "LINEAR" });
        for (const channel of animation.channels) {
            expect(gltf.nodes[channel.target.node].name).toBe("triangle");
            const input = gltf.accessors[animation.samplers[channel.sampler].input];
            expect(input.min[0]).toBe(0);
            expect(input.max[0]).toBeCloseTo(1);
        }
    });

    it("exports only the animations accepted by shouldExportAnimation", async () => {
        await RoundTripGltfAsync(testScene.scene, createAnimatedGltf());

        const gltf = await ExportGltfAsync(testScene.scene, { shouldExportAnimation: () => false });

        expect(gltf.animations).toBeUndefined();
    });
});
