import { describe, expect, it } from "vitest";

import { CreateUsdFileLoaderOptionsAsync, GetInputFilePath, GetUsdRootCandidates, SetInputFilePath } from "../../src/tools/usdFileInput";

describe("Sandbox USD file input", () => {
    it("preserves case and directory paths", () => {
        const file = new File(["texture"], "Albedo.PNG");
        SetInputFilePath(file, "/Package\\Textures\\Albedo.PNG");

        expect(GetInputFilePath(file)).toBe("Package/Textures/Albedo.PNG");
    });

    it("finds all supported USD root-layer extensions", () => {
        const files = [new File([""], "scene.usda"), new File([""], "layer.usdc"), new File([""], "archive.usdz"), new File([""], "texture.png")];

        expect(GetUsdRootCandidates(files).map(({ path }) => path)).toEqual(["scene.usda", "layer.usdc", "archive.usdz"]);
    });

    it("builds a shared virtual file system around the selected root", async () => {
        const root = new File(["root"], "Main.usda");
        const layer = new File(["layer"], "Geometry.usdc");
        const texture = new File(["texture"], "Albedo.PNG");
        SetInputFilePath(root, "Package/Scenes/Main.usda");
        SetInputFilePath(layer, "Package/Layers/Geometry.usdc");
        SetInputFilePath(texture, "Package/Textures/Albedo.PNG");

        const options = await CreateUsdFileLoaderOptionsAsync([root, layer, texture], root);

        expect(options.rootFileName).toBe("Package/Scenes/Main.usda");
        expect(Object.keys(options.files ?? {})).toEqual(["Package/Layers/Geometry.usdc", "Package/Textures/Albedo.PNG"]);
        expect(Array.from(new Uint8Array(options.files?.["Package/Layers/Geometry.usdc"] as ArrayBuffer))).toEqual(Array.from(new TextEncoder().encode("layer")));
    });

    it("rejects duplicate virtual paths", async () => {
        const root = new File(["root"], "Main.usda");
        const first = new File(["first"], "first.png");
        const second = new File(["second"], "second.png");
        SetInputFilePath(first, "Package/texture.png");
        SetInputFilePath(second, "Package/texture.png");

        await expect(CreateUsdFileLoaderOptionsAsync([root, first, second], root)).rejects.toThrow("duplicate path 'Package/texture.png'");
    });
});
