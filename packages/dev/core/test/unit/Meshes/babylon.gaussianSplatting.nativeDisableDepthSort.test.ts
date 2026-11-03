import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Repro for the Babylon Native "Invalid argument" crash: on Native, `_postToWorker` enters the
// `Native.sortSplats` path before honoring `disableDepthSort`, and can call it with a null `_splatIndex`.
describe("GaussianSplatting - Native sorting with disableDepthSort", () => {
    let sortSplats: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        sortSplats = vi.fn();
        // `IsNative`/`Native` are module-level consts derived from the global `_native`, so it must
        // exist before the GS module is imported.
        (globalThis as any)._native = { sortSplats };
        vi.resetModules();
    });

    afterEach(() => {
        delete (globalThis as any)._native;
        vi.resetModules();
    });

    const createScene = async () => {
        const { NullEngine } = await import("core/Engines/nullEngine");
        const { Scene } = await import("core/scene");
        const { FreeCamera } = await import("core/Cameras/freeCamera");
        const { Vector3 } = await import("core/Maths/math.vector");
        await import("core/Materials/GaussianSplatting/gaussianSplattingMaterial");
        const engine = new NullEngine();
        (engine.getCaps() as { maxVertexUniformVectors: number }).maxVertexUniformVectors = 256;
        const scene = new Scene(engine);
        const camera = new FreeCamera("camera", new Vector3(0, 0, -10), scene);
        scene.activeCamera = camera;
        return { engine, scene };
    };

    const createSplatData = (count: number) => {
        const data = new ArrayBuffer(count * 32);
        const floats = new Float32Array(data);
        const bytes = new Uint8Array(data);
        for (let i = 0; i < count; i++) {
            floats[i * 8 + 0] = i;
            floats[i * 8 + 3] = 0.5;
            floats[i * 8 + 4] = 0.5;
            floats[i * 8 + 5] = 0.5;
            bytes[i * 32 + 24] = 255;
            bytes[i * 32 + 25] = 255;
            bytes[i * 32 + 26] = 255;
            bytes[i * 32 + 27] = 255;
            bytes[i * 32 + 29] = 128;
            bytes[i * 32 + 30] = 128;
            bytes[i * 32 + 31] = 128;
        }
        return data;
    };

    it("does not call the native sort with a null splat index buffer before data is loaded", async () => {
        const { GaussianSplattingMesh } = await import("core/Meshes/GaussianSplatting/gaussianSplattingMesh");
        const { engine, scene } = await createScene();

        const mesh = new GaussianSplattingMesh("gs", null, scene);
        mesh.disableDepthSort = true;

        // isReady()/render() reach _postToWorker before any splat data has been committed.
        expect(() => mesh._postToWorker(true)).not.toThrow();

        for (const call of sortSplats.mock.calls) {
            // args: (modelViewProjection, splatPositions, splatIndex, rightHanded)
            expect(call[1], "splatPositions passed to Native.sortSplats must not be null").not.toBeNull();
            expect(call[2], "splatIndex passed to Native.sortSplats must not be null").not.toBeNull();
        }

        scene.dispose();
        engine.dispose();
        // Generous timeout: each test in this suite pays the full core re-import cost because vi.resetModules() runs in beforeEach.
    }, 30000);

    it("does not run the native sort at all when depth sort is disabled", async () => {
        const { GaussianSplattingMesh } = await import("core/Meshes/GaussianSplatting/gaussianSplattingMesh");
        const { engine, scene } = await createScene();

        const mesh = new GaussianSplattingMesh("gs", null, scene);
        mesh.disableDepthSort = true;

        mesh.updateData(createSplatData(4));

        sortSplats.mockClear();
        mesh._postToWorker(true);

        expect(sortSplats).not.toHaveBeenCalled();

        scene.dispose();
        engine.dispose();
    });

    it("keeps the splat index buffer allocated when depth sort is disabled after loading", async () => {
        const { GaussianSplattingMesh } = await import("core/Meshes/GaussianSplatting/gaussianSplattingMesh");
        const { engine, scene } = await createScene();

        const mesh = new GaussianSplattingMesh("gs", null, scene);
        mesh.updateData(createSplatData(4));
        mesh.disableDepthSort = true;

        sortSplats.mockClear();
        expect(() => mesh._postToWorker(true)).not.toThrow();

        expect((mesh as any)._splatIndex).not.toBeNull();
        expect(sortSplats).not.toHaveBeenCalled();

        scene.dispose();
        engine.dispose();
    });

    it("settles the depth sort after synchronous native sorting", async () => {
        const { GaussianSplattingMesh } = await import("core/Meshes/GaussianSplatting/gaussianSplattingMesh");
        const { engine, scene } = await createScene();

        const mesh = new GaussianSplattingMesh("gs", null, scene);
        mesh.updateData(createSplatData(4));

        sortSplats.mockClear();
        mesh.position.x = 1;
        mesh._postToWorker(true);

        expect(sortSplats).toHaveBeenCalledOnce();
        expect(mesh._isDepthSortSettled).toBe(true);

        scene.dispose();
        engine.dispose();
    });

    it("uploads updated splat data immediately when there is no sort worker", async () => {
        const { GaussianSplattingMesh } = await import("core/Meshes/GaussianSplatting/gaussianSplattingMesh");
        const { engine, scene } = await createScene();

        const mesh = new GaussianSplattingMesh("gs", null, scene);
        mesh.updateData(createSplatData(4));

        const updateSubTextures = vi.spyOn(mesh as any, "_updateSubTextures");
        mesh.updateData(createSplatData(4));

        expect(updateSubTextures).toHaveBeenCalledOnce();
        expect((mesh as any)._delayedTextureUpdate).toBeNull();

        scene.dispose();
        engine.dispose();
    });

    it("uploads updated splat data that adds spherical harmonics when there is no sort worker", async () => {
        const { GaussianSplattingMesh } = await import("core/Meshes/GaussianSplatting/gaussianSplattingMesh");
        const { engine, scene } = await createScene();

        const mesh = new GaussianSplattingMesh("gs", null, scene);
        mesh.updateData(createSplatData(4));
        expect((mesh as any)._shTextures).toBeNull();

        const textureSize = (mesh as any)._getTextureSize(4);
        const sh = [new Uint8Array(textureSize.x * textureSize.y * 16)];
        const updateShTextureData = vi.spyOn(mesh as any, "_updateShTextureData");
        expect(() => mesh.updateData(createSplatData(4), sh, { flipY: true }, undefined, 1)).not.toThrow();

        expect((mesh as any)._shTextures).toHaveLength(1);
        expect((mesh as any)._delayedTextureUpdate).toBeNull();
        expect(updateShTextureData).toHaveBeenCalledOnce();

        scene.dispose();
        engine.dispose();
    });

    it("grows existing spherical harmonics textures when an update raises the SH degree without a sort worker", async () => {
        const { GaussianSplattingMesh } = await import("core/Meshes/GaussianSplatting/gaussianSplattingMesh");
        const { engine, scene } = await createScene();

        const mesh = new GaussianSplattingMesh("gs", null, scene);
        const textureSize = (mesh as any)._getTextureSize(4);
        const shTextureBytes = textureSize.x * textureSize.y * 16;
        mesh.updateData(createSplatData(4), [new Uint8Array(shTextureBytes)], { flipY: true }, undefined, 1);
        const firstShTexture = (mesh as any)._shTextures[0];
        expect((mesh as any)._shTextures).toHaveLength(1);

        const sh = [new Uint8Array(shTextureBytes), new Uint8Array(shTextureBytes)];
        const updateShTextureData = vi.spyOn(mesh as any, "_updateShTextureData");
        expect(() => mesh.updateData(createSplatData(4), sh, { flipY: true }, undefined, 2)).not.toThrow();

        const shTextures = (mesh as any)._shTextures;
        expect(shTextures).toHaveLength(2);
        expect(shTextures[0]).toBe(firstShTexture);
        expect((mesh as any)._delayedTextureUpdate).toBeNull();
        expect(updateShTextureData.mock.calls.map((call) => call[0])).toEqual(shTextures);

        scene.dispose();
        engine.dispose();
    }, 30000);

    it("uploads existing rotation and scale textures once per update when there is no sort worker", async () => {
        const { GaussianSplattingMesh } = await import("core/Meshes/GaussianSplatting/gaussianSplattingMesh");
        const { engine, scene } = await createScene();

        const mesh = new GaussianSplattingMesh("gs", null, scene);
        mesh.needsRotationScaleTextures = true;
        mesh.updateData(createSplatData(4));
        const rotationTextures = [(mesh as any)._rotationsATexture, (mesh as any)._rotationsBTexture, (mesh as any)._rotationScaleTexture];
        expect(rotationTextures.every((texture) => !!texture)).toBe(true);

        const updateTextureFromData = vi.spyOn(mesh as any, "_updateTextureFromData");
        mesh.updateData(createSplatData(4));

        for (const texture of rotationTextures) {
            expect(updateTextureFromData.mock.calls.filter((call) => call[0] === texture)).toHaveLength(1);
        }

        scene.dispose();
        engine.dispose();
    });
});
