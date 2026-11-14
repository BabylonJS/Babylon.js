import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { InternalTextureSource } from "core/Materials/Textures/internalTexture";
import { OpenPBRMaterial } from "core/Materials/PBR/openpbrMaterial";
import { Texture } from "core/Materials/Textures/texture";
import { CreateBox } from "core/Meshes/Builders/boxBuilder";
import { Tools } from "core/Misc/tools";
import { Logger } from "core/Misc/logger";
import { Scene } from "core/scene";
import { ImportMeshAsync } from "core/Loading/sceneLoader";
import { GLTF2Export } from "serializers/glTF/2.0/glTFSerializer";
import { KHR_materials_retroreflection, RegisterKHR_materials_retroreflection } from "serializers/glTF/2.0/Extensions/KHR_materials_retroreflection.pure";
import { GLTFExporter } from "serializers/glTF/2.0/glTFExporter";
import { registerBuiltInLoaders } from "loaders/dynamic";

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
registerBuiltInLoaders();

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

    it("omits material data and textures when the exporter extension is disabled", async () => {
        const texture = new Texture("retro.png", scene, { buffer: OnePixelRedPng, mimeType: "image/png" });
        texture.getInternalTexture()!._buffer = OnePixelRedPng;
        material.specularRetroreflectivity = 0.75;
        material.specularRetroreflectivityTexture = texture;

        GLTFExporter.UnregisterExtension("KHR_materials_retroreflection");
        GLTFExporter.RegisterExtension("KHR_materials_retroreflection", (exporter) => {
            const extension = new KHR_materials_retroreflection(exporter);
            extension.enabled = false;
            return extension;
        });
        try {
            const glTF = await exportSceneAsync();

            expect.soft(glTF.materials[0].extensions?.KHR_materials_retroreflection).toBeUndefined();
            expect.soft(glTF.textures ?? []).toHaveLength(0);
            expect(glTF.extensionsUsed ?? []).not.toContain("KHR_materials_retroreflection");
        } finally {
            GLTFExporter.UnregisterExtension("KHR_materials_retroreflection");
            GLTFExporter.RegisterExtension("KHR_materials_retroreflection", (exporter) => new KHR_materials_retroreflection(exporter));
        }
    });

    it.each([
        [1, 0.75],
        [0.25, 0.1875],
        [0, 0],
        [1.25, 0.9375],
    ])("exports the retroreflection texture with level %s", async (level, factor) => {
        const texture = new Texture("retro.png", scene, {
            buffer: OnePixelRedPng,
            mimeType: "image/png",
        });
        const internalTexture = texture.getInternalTexture()!;
        expect(internalTexture.source).toBe(InternalTextureSource.Url);
        internalTexture._buffer = OnePixelRedPng;
        texture.level = level;

        material.specularRetroreflectivity = 0.75;
        material.specularRetroreflectivityTexture = texture;

        const glTF = await exportSceneAsync();
        const extension = glTF.materials[0].extensions?.KHR_materials_retroreflection;

        expect(glTF.textures).toHaveLength(1);
        expect(extension).toEqual({
            retroreflectionFactor: factor === 0 ? undefined : factor,
            retroreflectionTexture: { index: 0 },
        });
    });

    it("warns and clamps texture-weighted factors that glTF cannot represent", async () => {
        const texture = new Texture("retro.png", scene, { buffer: OnePixelRedPng, mimeType: "image/png" });
        texture.getInternalTexture()!._buffer = OnePixelRedPng;
        texture.level = 2;
        material.specularRetroreflectivity = 0.75;
        material.specularRetroreflectivityTexture = texture;
        const warn = vi.spyOn(Logger, "Warn").mockImplementation(() => {});
        try {
            const glTF = await exportSceneAsync();

            expect(glTF.materials[0].extensions?.KHR_materials_retroreflection?.retroreflectionFactor).toBe(1);
            expect(warn).toHaveBeenCalledWith(expect.stringContaining("outside [0, 1]"));
        } finally {
            warn.mockRestore();
        }
    });

    it.each([0, 0.25, 1, 1.25])("preserves effective retroreflection after exporting and reloading texture level %s", async (level) => {
        const texture = new Texture("retro.png", scene, { buffer: OnePixelRedPng, mimeType: "image/png" });
        texture.getInternalTexture()!._buffer = OnePixelRedPng;
        texture.gammaSpace = false;
        texture.level = level;
        material.specularRetroreflectivity = 0.75;
        material.specularRetroreflectivityTexture = texture;

        const exported = await GLTF2Export.GLBAsync(scene, "roundtrip");
        const file = exported.files["roundtrip.glb"];
        expect(file).toBeInstanceOf(Blob);
        const bytes = new Uint8Array(await (file as Blob).arrayBuffer());
        const reloadedScene = new Scene(engine);
        try {
            const result = await ImportMeshAsync(bytes, reloadedScene, { pluginExtension: ".glb" });
            const reloaded = result.meshes.find((mesh) => mesh.material?.name === "retro")?.material;
            expect(reloaded).toBeInstanceOf(OpenPBRMaterial);
            const reloadedMaterial = reloaded as OpenPBRMaterial;
            expect(reloadedMaterial.specularRetroreflectivityTexture).not.toBeNull();
            expect(reloadedMaterial.specularRetroreflectivity * reloadedMaterial.specularRetroreflectivityTexture!.level).toBeCloseTo(
                material.specularRetroreflectivity * texture.level
            );
        } finally {
            reloadedScene.dispose();
        }
    });
});
