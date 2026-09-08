import { beforeEach, describe, expect, it, vi } from "vitest";

async function isGLTFFileLoaderRegistered(): Promise<boolean> {
    const { GetRegisteredSceneLoaderPluginMetadata } = await import("core/Loading/sceneLoader");
    return GetRegisteredSceneLoaderPluginMetadata().some((plugin) => plugin.extensions.some((extension) => extension.extension.toLowerCase() === ".gltf"));
}

describe("glTF 1.0 registration", () => {
    beforeEach(() => {
        vi.resetModules();
    });

    it("keeps pure modules opt-in", async () => {
        const { Color3 } = await import("core/Maths/math.color.pure");
        const { ShaderMaterial } = await import("core/Materials/shaderMaterial.pure");
        const { SerializationHelper } = await import("core/Misc/decorators.serialization");
        const colorDimension = Object.getOwnPropertyDescriptor(Color3.prototype, "dimension");
        const shaderMaterialParse = ShaderMaterial.Parse;
        const textureParser = SerializationHelper._TextureParser;
        const { GLTFFileLoader } = await import("loaders/glTF/glTFFileLoader.pure");
        const { GLTFLoader } = await import("loaders/glTF/1.0/glTFLoader.pure");
        const binaryExtension = await import("loaders/glTF/1.0/glTFBinaryExtension.pure");
        const materialsCommonExtension = await import("loaders/glTF/1.0/glTFMaterialsCommonExtension.pure");

        expect(Object.getOwnPropertyDescriptor(Color3.prototype, "dimension")).toBe(colorDimension);
        expect(ShaderMaterial.Parse).toBe(shaderMaterialParse);
        expect(SerializationHelper._TextureParser).toBe(textureParser);
        expect(GLTFFileLoader._CreateGLTF1Loader).toBeUndefined();
        expect(GLTFLoader.Extensions.KHR_binary_glTF).toBeUndefined();
        expect(GLTFLoader.Extensions.KHR_materials_common).toBeUndefined();
        expect(await isGLTFFileLoaderRegistered()).toBe(false);

        const loader = await import("loaders/glTF/1.0/glTFLoader.pure");
        loader.RegisterGLTF1Loader();
        binaryExtension.RegisterGLTFBinaryExtension();
        materialsCommonExtension.RegisterGLTFMaterialsCommonExtension();

        expect(GLTFFileLoader._CreateGLTF1Loader).toBeDefined();
        expect(GLTFLoader.Extensions.KHR_binary_glTF).toBeInstanceOf(binaryExtension.GLTFBinaryExtension);
        expect(GLTFLoader.Extensions.KHR_materials_common).toBeInstanceOf(materialsCommonExtension.GLTFMaterialsCommonExtension);
        expect(await isGLTFFileLoaderRegistered()).toBe(false);
    });

    it("auto-registers when importing the legacy entry point", async () => {
        const { GLTFFileLoader } = await import("loaders/glTF/glTFFileLoader.pure");
        const { GLTFLoader } = await import("loaders/glTF/1.0/glTFLoader.pure");

        expect(GLTFFileLoader._CreateGLTF1Loader).toBeUndefined();
        expect(GLTFLoader.Extensions.KHR_binary_glTF).toBeUndefined();
        expect(GLTFLoader.Extensions.KHR_materials_common).toBeUndefined();

        await import("loaders/glTF/1.0");

        expect(GLTFFileLoader._CreateGLTF1Loader).toBeDefined();
        expect(GLTFLoader.Extensions.KHR_binary_glTF).toBeDefined();
        expect(GLTFLoader.Extensions.KHR_materials_common).toBeDefined();
        expect(await isGLTFFileLoaderRegistered()).toBe(true);
    });

    it("preserves loader registration when importing the legacy binary extension directly", async () => {
        const { GLTFFileLoader } = await import("loaders/glTF/glTFFileLoader.pure");
        const { GLTFLoader } = await import("loaders/glTF/1.0/glTFLoader.pure");

        expect(GLTFFileLoader._CreateGLTF1Loader).toBeUndefined();
        expect(GLTFLoader.Extensions.KHR_binary_glTF).toBeUndefined();

        await import("loaders/glTF/1.0/glTFBinaryExtension");

        expect(GLTFFileLoader._CreateGLTF1Loader).toBeDefined();
        expect(GLTFLoader.Extensions.KHR_binary_glTF).toBeDefined();
        expect(await isGLTFFileLoaderRegistered()).toBe(true);
    });

    it("preserves loader registration when importing the legacy materials extension directly", async () => {
        const { GLTFFileLoader } = await import("loaders/glTF/glTFFileLoader.pure");
        const { GLTFLoader } = await import("loaders/glTF/1.0/glTFLoader.pure");

        expect(GLTFFileLoader._CreateGLTF1Loader).toBeUndefined();
        expect(GLTFLoader.Extensions.KHR_materials_common).toBeUndefined();

        await import("loaders/glTF/1.0/glTFMaterialsCommonExtension");

        expect(GLTFFileLoader._CreateGLTF1Loader).toBeDefined();
        expect(GLTFLoader.Extensions.KHR_materials_common).toBeDefined();
        expect(await isGLTFFileLoaderRegistered()).toBe(true);
    });
});
