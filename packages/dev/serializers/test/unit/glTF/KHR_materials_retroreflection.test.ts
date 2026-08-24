import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { InternalTextureSource } from "core/Materials/Textures/internalTexture";
import { OpenPBRMaterial } from "core/Materials/PBR/openpbrMaterial";
import { Texture } from "core/Materials/Textures/texture";
import { CreateBox } from "core/Meshes/Builders/boxBuilder";
import { Tools } from "core/Misc/tools";
import { Scene } from "core/scene";
import { GLTF2Export } from "serializers/glTF/2.0/glTFSerializer";
import { RegisterKHR_materials_retroreflection } from "serializers/glTF/2.0/Extensions/KHR_materials_retroreflection.pure";

interface IRetroreflectionExport {
    extensionsUsed?: string[];
    extensionsRequired?: string[];
    materials: Array<{
        extensions?: {
            KHR_materials_retroreflection?: {
                retroreflectionFactor?: number;
                retroreflectionTexture?: {
                    index: number;
                };
            };
        };
    }>;
    textures?: unknown[];
}

const OnePixelRedPng = new Uint8Array([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x02, 0x00, 0x00, 0x00,
    0x90, 0x77, 0x53, 0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41, 0x54, 0x08, 0x99, 0x63, 0xf8, 0xcf, 0xc0, 0x00, 0x00, 0x00, 0x03, 0x00, 0x01, 0x5b, 0x82, 0x5c, 0x17, 0x00,
    0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
]);

RegisterKHR_materials_retroreflection();

describe("KHR_materials_retroreflection glTF exporter", () => {
    let engine: NullEngine;
    let scene: Scene;
    let material: OpenPBRMaterial;
    let loadScriptSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
        material = new OpenPBRMaterial("retro", scene);
        CreateBox("box", {}, scene).material = material;
        loadScriptSpy = vi.spyOn(Tools, "LoadScriptAsync").mockImplementation(async () => {
            throw new Error("Tools.LoadScriptAsync must not be called in a Node.js environment.");
        });
    });

    afterEach(() => {
        loadScriptSpy.mockRestore();
        scene.dispose();
        engine.dispose();
    });

    async function exportSceneAsync(): Promise<IRetroreflectionExport> {
        const result = await GLTF2Export.GLTFAsync(scene, "test");
        return JSON.parse(result.files["test.gltf"] as string) as IRetroreflectionExport;
    }

    it("omits the extension at its default value", async () => {
        const glTF = await exportSceneAsync();

        expect(glTF.extensionsUsed ?? []).not.toContain("KHR_materials_retroreflection");
        expect(glTF.materials[0].extensions?.KHR_materials_retroreflection).toBeUndefined();
    });

    it("exports the retroreflection factor as an optional extension", async () => {
        material.specularRetroreflectivity = 0.6;

        const glTF = await exportSceneAsync();
        const extension = glTF.materials[0].extensions?.KHR_materials_retroreflection;

        expect(glTF.extensionsUsed).toContain("KHR_materials_retroreflection");
        expect(glTF.extensionsRequired ?? []).not.toContain("KHR_materials_retroreflection");
        expect(extension).toEqual({ retroreflectionFactor: 0.6 });
    });

    it("exports the retroreflection texture", async () => {
        const texture = new Texture("retro.png", scene, {
            buffer: OnePixelRedPng,
            mimeType: "image/png",
        });
        const internalTexture = texture.getInternalTexture()!;
        expect(internalTexture.source).toBe(InternalTextureSource.Url);
        internalTexture._buffer = OnePixelRedPng;

        material.specularRetroreflectivity = 0.75;
        material.specularRetroreflectivityTexture = texture;

        const glTF = await exportSceneAsync();
        const extension = glTF.materials[0].extensions?.KHR_materials_retroreflection;

        expect(glTF.textures).toHaveLength(1);
        expect(extension).toEqual({
            retroreflectionFactor: 0.75,
            retroreflectionTexture: { index: 0 },
        });
    });
});
