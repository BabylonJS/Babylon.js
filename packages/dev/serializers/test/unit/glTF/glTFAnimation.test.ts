import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Animation } from "core/Animations/animation";
import { AnimationGroup } from "core/Animations/animationGroup";
import { Vector3 } from "core/Maths/math.vector";
import { TransformNode } from "core/Meshes/transformNode";
import { type IAccessor, type IAnimationChannelTarget, type IAnimationSampler } from "babylonjs-gltf2interface";
import {
    CreateTestScene,
    CreateTriangleGltf,
    ExportGltfAsync,
    ExportGltfWithBinaryAsync,
    ReadAccessor,
    RoundTripGltfWithBinaryAsync,
    ToDataUri,
    type GltfJson,
} from "./glTFTestUtils";

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

    // https://forum.babylonjs.com/t/the-function-call-is-missing-parameter-shouldexportanimation/55466 (fixed by https://github.com/BabylonJS/Babylon.js/pull/16102)
    it("exports only animation-group channels accepted by shouldExportAnimation", async () => {
        const node = new TransformNode("animated", testScene.scene);
        const kept = new Animation("kept", "position", 30, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CYCLE);
        kept.setKeys([
            { frame: 0, value: Vector3.Zero() },
            { frame: 30, value: Vector3.One() },
        ]);
        const skipped = new Animation("skipped", "scaling", 30, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CYCLE);
        skipped.setKeys([
            { frame: 0, value: Vector3.One() },
            { frame: 30, value: Vector3.One().scale(2) },
        ]);
        const group = new AnimationGroup("group", testScene.scene);
        group.addTargetedAnimation(kept, node);
        group.addTargetedAnimation(skipped, node);
        const visited: string[] = [];

        const gltf = await ExportGltfAsync(testScene.scene, {
            shouldExportAnimation: (animation) => {
                visited.push(animation.name);
                return animation === kept;
            },
        });

        const animations = gltf.animations;
        if (!animations) {
            throw new Error("Expected an exported animation group");
        }
        expect(visited).toEqual(["kept", "skipped"]);
        expect(animations).toHaveLength(1);
        expect(animations[0].channels).toHaveLength(1);
        expect(animations[0].channels[0].target.path).toBe("translation");
    });

    // https://forum.babylonjs.com/t/able-to-corrupt-gltf-file-by-adding-an-animation-that-rotates/36620 (fixed by https://github.com/BabylonJS/Babylon.js/pull/13356)
    it("exports Euler rotation animations with matching finite sampler counts", async () => {
        const node = new TransformNode("animated", testScene.scene);
        const animation = new Animation("rotate", "rotation", 30, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CYCLE);
        animation.setKeys([
            { frame: 0, value: Vector3.Zero() },
            { frame: 30, value: new Vector3(0.2, 0.4, 0.6) },
        ]);
        node.animations.push(animation);

        const { gltf, bin } = await ExportGltfWithBinaryAsync(testScene.scene);
        const exportedAnimation = gltf.animations?.[0];
        if (!exportedAnimation) {
            throw new Error("Expected an exported animation");
        }
        const channel = exportedAnimation.channels[0];
        const sampler = exportedAnimation.samplers[channel.sampler];
        const inputs = ReadAccessor(gltf, bin, sampler.input);
        const outputs = ReadAccessor(gltf, bin, sampler.output);

        expect(channel.target.path).toBe("rotation");
        expect(outputs).toHaveLength(inputs.length * 4);
        expect(outputs.every(Number.isFinite)).toBe(true);
        for (let index = 0; index < outputs.length; index += 4) {
            expect(Math.hypot(...outputs.slice(index, index + 4))).toBeCloseTo(1);
        }
    });
});
