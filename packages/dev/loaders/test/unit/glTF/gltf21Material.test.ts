import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import { OpenPBRMaterial } from "core/Materials/PBR/openpbrMaterial";
import { Scene } from "core/scene";
import { AnimationGroup } from "core/Animations/animationGroup";
import { GLTFFileLoader } from "loaders/glTF/glTFFileLoader.pure";
import { type IGLTF } from "loaders/glTF/2.0/glTFLoaderInterfaces";
import { GetPathToObjectConverter } from "loaders/glTF/2.0/Extensions/objectModelMapping";
import "loaders/glTF/2.0/glTFLoader";
import "loaders/glTF/2.0/Extensions/KHR_animation_pointer";
import "loaders/glTF/2.0/Extensions/KHR_animation_pointer.data";
import "loaders/glTF/2.0/Extensions/KHR_materials_emissive_strength";

describe("glTF 2.1 emissive strength", () => {
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

    async function loadStrength(version: string, coreStrength?: number, extensionStrength?: number, useOpenPBR = false): Promise<number> {
        const positions = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]);
        const bytes = new Uint8Array(positions.buffer);
        const data = {
            json: {
                asset: { version },
                extensionsUsed: extensionStrength === undefined ? [] : ["KHR_materials_emissive_strength"],
                scene: 0,
                scenes: [{ nodes: [0] }],
                nodes: [{ mesh: 0 }],
                meshes: [{ primitives: [{ attributes: { POSITION: 0 }, material: 0 }] }],
                materials: [
                    {
                        emissiveFactor: [1, 1, 1],
                        emissiveStrength: coreStrength,
                        extensions: extensionStrength === undefined ? undefined : { KHR_materials_emissive_strength: { emissiveStrength: extensionStrength } },
                    },
                ],
                accessors: [{ bufferView: 0, componentType: 5126, count: 3, type: "VEC3", min: [0, 0, 0], max: [1, 1, 0] }],
                bufferViews: [{ buffer: 0, byteLength: bytes.byteLength }],
                buffers: [{ byteLength: bytes.byteLength }],
            },
            bin: {
                byteLength: bytes.byteLength,
                readAsync: async (offset: number, length: number) => bytes.subarray(offset, offset + length),
            },
        };
        const loader = new GLTFFileLoader();
        loader.useOpenPBR = useOpenPBR;
        const container = await loader.loadAssetContainerAsync(scene, data, "");
        const material = container.materials[0];
        expect(material).toBeInstanceOf(useOpenPBR ? OpenPBRMaterial : PBRMaterial);
        if (material instanceof OpenPBRMaterial) {
            return material.emissionLuminance;
        }
        if (material instanceof PBRMaterial) {
            return material.emissiveIntensity;
        }
        throw new Error("Unexpected material type");
    }

    it("loads the core property", async () => {
        expect(await loadStrength("2.1", 4)).toBe(4);
        expect(await loadStrength("2.1", undefined)).toBe(1);
    });

    it("prefers the core property when both forms are present", async () => {
        expect(await loadStrength("2.1", 4, 2)).toBe(4);
        expect(await loadStrength("2.1", 0, 2)).toBe(0);
    });

    it("uses the extension when the core property is absent", async () => {
        expect(await loadStrength("2.1", undefined, 2)).toBe(2);
    });

    it("preserves the extension behavior for glTF 2.0", async () => {
        expect(await loadStrength("2.0", undefined, 2)).toBe(2);
    });

    it("loads core and extension values with OpenPBR", async () => {
        expect(await loadStrength("2.1", 4, 2, true)).toBe(4);
        expect(await loadStrength("2.1", 0, 2, true)).toBe(0);
        expect(await loadStrength("2.1", undefined, 2, true)).toBe(2);
    });

    it("reads, writes and animates the core property for each material implementation", () => {
        const pbr = new PBRMaterial("pbr", scene);
        const openPBR = new OpenPBRMaterial("openPBR", scene);
        const gltf: IGLTF = {
            asset: { version: "2.1" },
            materials: [
                {
                    index: 0,
                    _data: {
                        0: { babylonMaterial: pbr, babylonMeshes: [], promise: Promise.resolve() },
                        1: { babylonMaterial: openPBR, babylonMeshes: [], promise: Promise.resolve() },
                    },
                },
            ],
        };
        const { object, info } = GetPathToObjectConverter(gltf).convert("/materials/0/emissiveStrength");
        expect(info.get(object, undefined, { fillMode: 0 })).toBe(1);
        expect(info.get(object, undefined, { fillMode: 1 })).toBe(1);
        info.set!(2, object);
        expect(pbr.emissiveIntensity).toBe(2);
        expect(openPBR.emissionLuminance).toBe(2);
        info.set!(3, object, undefined, { fillMode: 1 });
        expect(pbr.emissiveIntensity).toBe(2);
        expect(openPBR.emissionLuminance).toBe(3);

        const group = new AnimationGroup("emission", scene);
        const tracks = info.interpolation![0].buildAnimations(object, "strength", 60, [
            { frame: 0, value: 1 },
            { frame: 60, value: 4 },
        ]);
        for (const track of tracks) {
            group.addTargetedAnimation(track.babylonAnimation, track.babylonAnimatable);
        }
        expect(tracks.map((track) => track.babylonAnimation.targetProperty)).toEqual(["emissiveIntensity", "emissionLuminance"]);
        group.play();
        group.goToFrame(60);
        expect(pbr.emissiveIntensity).toBe(4);
        expect(openPBR.emissionLuminance).toBe(4);
    });

    it.each([false, true])("loads animation pointers for core emissive strength (OpenPBR: %s)", async (useOpenPBR) => {
        const values = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 1, 4]);
        const bytes = new Uint8Array(values.buffer);
        const loader = new GLTFFileLoader();
        loader.useOpenPBR = useOpenPBR;
        const container = await loader.loadAssetContainerAsync(
            scene,
            {
                json: {
                    asset: { version: "2.1" },
                    extensionsUsed: ["KHR_animation_pointer"],
                    scene: 0,
                    scenes: [{ nodes: [0] }],
                    nodes: [{ mesh: 0 }],
                    meshes: [{ primitives: [{ attributes: { POSITION: 0 }, material: 0 }] }],
                    materials: [{ emissiveFactor: [1, 1, 1] }],
                    buffers: [{ byteLength: bytes.byteLength }],
                    bufferViews: [
                        { buffer: 0, byteLength: 36 },
                        { buffer: 0, byteOffset: 36, byteLength: 8 },
                        { buffer: 0, byteOffset: 44, byteLength: 8 },
                    ],
                    accessors: [
                        { bufferView: 0, componentType: 5126, count: 3, type: "VEC3", min: [0, 0, 0], max: [1, 1, 0] },
                        { bufferView: 1, componentType: 5126, count: 2, type: "SCALAR", min: [0], max: [1] },
                        { bufferView: 2, componentType: 5126, count: 2, type: "SCALAR" },
                    ],
                    animations: [
                        {
                            samplers: [{ input: 1, output: 2 }],
                            channels: [
                                {
                                    sampler: 0,
                                    target: { path: "pointer", extensions: { KHR_animation_pointer: { pointer: "/materials/0/emissiveStrength" } } },
                                },
                            ],
                        },
                    ],
                },
                bin: { byteLength: bytes.byteLength, readAsync: async (offset: number, length: number) => bytes.subarray(offset, offset + length) },
            },
            ""
        );
        const material = container.materials[0];
        const group = container.animationGroups[0];
        expect(group.targetedAnimations).toHaveLength(1);
        expect(group.targetedAnimations[0].target).toBe(material);
        expect(group.targetedAnimations[0].animation.targetProperty).toBe(useOpenPBR ? "emissionLuminance" : "emissiveIntensity");
        group.play();
        group.goToFrame(60);
        expect(material).toBeInstanceOf(useOpenPBR ? OpenPBRMaterial : PBRMaterial);
        const strength = material instanceof OpenPBRMaterial ? material.emissionLuminance : material instanceof PBRMaterial ? material.emissiveIntensity : undefined;
        expect(strength).toBe(4);
    });
});
