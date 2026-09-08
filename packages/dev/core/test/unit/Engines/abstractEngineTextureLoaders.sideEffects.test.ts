import { beforeEach, describe, expect, it, vi } from "vitest";

describe("AbstractEngine texture loader registration", () => {
    beforeEach(() => {
        vi.resetModules();
    });

    it("keeps the pure module opt-in", async () => {
        const { AbstractEngine } = await import("core/Engines/abstractEngine.pure");
        const { _GetCompatibleTextureLoader } = await import("core/Materials/Textures/Loaders/textureLoaderManager");
        const { RegisterAbstractEngineTextureLoaders } = await import("core/Engines/AbstractEngine/abstractEngine.textureLoaders.pure");

        expect(AbstractEngine.GetCompatibleTextureLoader).not.toBe(_GetCompatibleTextureLoader);

        RegisterAbstractEngineTextureLoaders();
        expect(AbstractEngine.GetCompatibleTextureLoader).toBe(_GetCompatibleTextureLoader);

        RegisterAbstractEngineTextureLoaders();
        expect(AbstractEngine.GetCompatibleTextureLoader).toBe(_GetCompatibleTextureLoader);
    });

    it("auto-registers when importing the legacy wrapper", async () => {
        const { AbstractEngine } = await import("core/Engines/abstractEngine.pure");
        const { _GetCompatibleTextureLoader } = await import("core/Materials/Textures/Loaders/textureLoaderManager");

        expect(AbstractEngine.GetCompatibleTextureLoader).not.toBe(_GetCompatibleTextureLoader);

        await import("core/Engines/AbstractEngine/abstractEngine.textureLoaders");
        expect(AbstractEngine.GetCompatibleTextureLoader).toBe(_GetCompatibleTextureLoader);
    });
});
