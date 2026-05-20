import { describe, expect, it } from "vitest";
import { GetRegisteredSceneLoaderPluginMetadata, SceneLoader } from "core/Loading/sceneLoader";
import { registerBuiltInLoaders } from "loaders/dynamic";
import { FBXFileLoaderMetadata } from "loaders/FBX/fbxFileLoader.metadata";
// eslint-disable-next-line babylonjs/no-directory-barrel-imports
import "loaders/FBX";

describe("FBX loader registration", () => {
    it("registers the FBX loader when importing loaders/FBX", () => {
        const plugin = SceneLoader.GetPluginForExtension(".fbx");
        const metadata = GetRegisteredSceneLoaderPluginMetadata().find((entry) => entry.name === FBXFileLoaderMetadata.name);

        expect(plugin?.name).toBe(FBXFileLoaderMetadata.name);
        expect(metadata?.extensions).toEqual([
            {
                extension: ".fbx",
                isBinary: true,
            },
        ]);
    });

    it("registers the FBX loader through dynamic built-in registration", () => {
        registerBuiltInLoaders();

        const plugin = SceneLoader.GetPluginForExtension(".fbx");
        const metadata = GetRegisteredSceneLoaderPluginMetadata().find((entry) => entry.name === FBXFileLoaderMetadata.name);

        expect(plugin?.name).toBe(FBXFileLoaderMetadata.name);
        expect(metadata?.extensions).toEqual([
            {
                extension: ".fbx",
                isBinary: true,
            },
        ]);
    });
});
