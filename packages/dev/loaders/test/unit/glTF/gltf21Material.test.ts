import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import { OpenPBRMaterial } from "core/Materials/PBR/openpbrMaterial";
import { Scene } from "core/scene";
import { GLTFFileLoader } from "loaders/glTF/glTFFileLoader.pure";
import "loaders/glTF/2.0/glTFLoader";
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
});
