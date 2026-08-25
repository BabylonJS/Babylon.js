import { describe, expect, it, vi } from "vitest";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { _ShaderImportLoader } from "core/Misc/shaderImportLoader";

describe("_ShaderImportLoader", () => {
    it("shares an in-flight import and stops returning callbacks after it loads", async () => {
        let resolveImport: (() => void) | undefined;
        const importPromise = new Promise<void>((resolve) => {
            resolveImport = resolve;
        });
        const loadWebGL = vi.fn(() => [importPromise]);
        const loader = new _ShaderImportLoader(loadWebGL, () => []);

        const delayedLoad = loader.getLoadCallback(ShaderLanguage.GLSL)!;
        const firstLoad = loader.getLoadCallback(ShaderLanguage.GLSL)!();
        const secondLoad = loader.getLoadCallback(ShaderLanguage.GLSL)!();

        expect(loadWebGL).toHaveBeenCalledOnce();

        resolveImport!();
        await Promise.all([firstLoad, secondLoad]);
        await delayedLoad();

        expect(loadWebGL).toHaveBeenCalledOnce();
        expect(loader.getLoadCallback(ShaderLanguage.GLSL)).toBeUndefined();
    });

    it("tracks GLSL and WGSL imports independently", async () => {
        const loadWebGL = vi.fn(() => []);
        const loadWebGPU = vi.fn(() => []);
        const loader = new _ShaderImportLoader(loadWebGL, loadWebGPU);

        await loader.getLoadCallback(ShaderLanguage.GLSL)!();

        expect(loader.getLoadCallback(ShaderLanguage.GLSL)).toBeUndefined();
        expect(loader.getLoadCallback(ShaderLanguage.WGSL)).toBeTypeOf("function");
        expect(loadWebGPU).not.toHaveBeenCalled();
    });

    it("allows a failed import to be retried", async () => {
        const error = new Error("shader import failed");
        const loadWebGL = vi
            .fn()
            .mockReturnValueOnce([Promise.reject(error)])
            .mockReturnValueOnce([Promise.resolve()]);
        const loader = new _ShaderImportLoader(loadWebGL, () => []);

        await expect(loader.getLoadCallback(ShaderLanguage.GLSL)!()).rejects.toBe(error);
        await expect(loader.getLoadCallback(ShaderLanguage.GLSL)!()).resolves.toBeUndefined();

        expect(loadWebGL).toHaveBeenCalledTimes(2);
        expect(loader.getLoadCallback(ShaderLanguage.GLSL)).toBeUndefined();
    });
});
