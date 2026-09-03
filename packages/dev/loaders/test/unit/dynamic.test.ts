import { describe, expect, it } from "vitest";
import { SceneLoader } from "core/Loading/sceneLoader";
import { registerBuiltInLoaders } from "loaders/dynamic";

describe("dynamic loader registration", () => {
    it.each([".bvh", ".fbx", ".gltf", ".obj", ".splat", ".stl"])("keeps the factory registered after creating the %s loader", async (extension) => {
        registerBuiltInLoaders();
        const factory = SceneLoader.GetPluginForExtension(extension);
        if (!factory || !("createPlugin" in factory)) {
            throw new Error(`Expected a dynamically registered loader factory for ${extension}`);
        }

        await factory.createPlugin({});

        expect(SceneLoader.GetPluginForExtension(extension)).toBe(factory);
    });
});
