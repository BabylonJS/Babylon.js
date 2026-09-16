import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { type Engine, NullEngine, ThinEngine, WebGPUEngine } from "core/Engines";
import { Constants } from "core/Engines/constants";
import { BaseTexture, CubeTexture, InternalTexture } from "core/Materials";
import { InternalTextureSource } from "core/Materials/Textures/internalTexture";
import { Scene } from "core/scene";
import { _KTXTextureLoader } from "core/Materials/Textures/Loaders/ktxTextureLoader";

/**
 * Helper to create a CubeTexture with a manually configured InternalTexture
 * in the engine's cache, avoiding network requests in tests.
 */
function createCachedCubeTexture(engine: Engine, scene: Scene, url: string): { cubeTexture: CubeTexture; internalTexture: InternalTexture } {
    // Use delayed loading to prevent the constructor from triggering XMLHttpRequest
    scene.useDelayedTextureLoading = true;
    const cubeTexture = new CubeTexture(url, scene);
    scene.useDelayedTextureLoading = false;

    // Create an InternalTexture and configure it to match the cache lookup keys
    const internalTexture = new InternalTexture(engine, InternalTextureSource.Unknown);
    internalTexture.url = url;
    internalTexture.generateMipMaps = true;
    internalTexture.isCube = true;
    internalTexture.isReady = true;

    // Assign the InternalTexture to the CubeTexture and register it in the engine's cache
    cubeTexture._texture = internalTexture;
    engine.getLoadedTexturesCache().push(internalTexture);

    return { cubeTexture, internalTexture };
}

describe("CubeTexture", () => {
    let engine: Engine;
    let scene: Scene;

    beforeEach(() => {
        engine = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });
        scene = new Scene(engine);
    });

    afterEach(() => {
        vi.restoreAllMocks();
        scene.dispose();
        engine.dispose();
    });

    describe.each([
        { name: "WebGL", createCubeTexture: ThinEngine.prototype.createCubeTexture, createPrefilteredCubeTexture: ThinEngine.prototype.createPrefilteredCubeTexture },
        { name: "WebGPU", createCubeTexture: WebGPUEngine.prototype.createCubeTexture, createPrefilteredCubeTexture: WebGPUEngine.prototype.createPrefilteredCubeTexture },
    ])("$name cube loading", ({ createCubeTexture, createPrefilteredCubeTexture }) => {
        it.each([
            { url: "environment.ktx2", forcedExtension: undefined },
            { url: "environment.ktx2?version=1", forcedExtension: undefined },
            { url: "environment.bin", forcedExtension: ".ktx2" },
        ])("does not route $url into the KTX1-only cube parser", async ({ url, forcedExtension }) => {
            vi.spyOn(engine, "createCubeTexture").mockImplementation((...args) => createCubeTexture.call(engine, ...args));
            const loadFile = vi.spyOn(engine, "_loadFile").mockImplementation(vi.fn());
            const loadCubeData = vi.spyOn(_KTXTextureLoader.prototype, "loadCubeData");
            const onLoad = vi.fn();
            const onError = vi.fn();
            const cube = new CubeTexture(url, scene, { forcedExtension, onLoad, onError });

            await vi.waitFor(() => expect(onError).toHaveBeenCalled());

            expect(onError).toHaveBeenCalledWith("Textures type does not support cascades.", undefined);
            expect(loadFile).not.toHaveBeenCalled();
            expect(loadCubeData).not.toHaveBeenCalled();
            expect(onLoad).not.toHaveBeenCalled();
            expect(cube.isReady()).toBe(false);
        });

        it("forwards a public prefiltered buffer to the cube loader", () => {
            vi.spyOn(engine, "createPrefilteredCubeTexture").mockImplementation((...args) => createPrefilteredCubeTexture.call(engine, ...args));
            const createCube = vi.spyOn(engine, "createCubeTexture").mockImplementation(() => new InternalTexture(engine, InternalTextureSource.Cube));
            const buffer = new DataView(new ArrayBuffer(8), 1, 3);

            new CubeTexture("prefiltered.dds", scene, { prefiltered: true, buffer, createPolynomials: false });

            expect(createCube).toHaveBeenCalledTimes(1);
            expect(createCube).toHaveBeenCalledWith(
                "prefiltered.dds",
                scene,
                null,
                false,
                expect.any(Function),
                expect.any(Function),
                Constants.TEXTUREFORMAT_RGBA,
                null,
                false,
                0.8,
                0,
                null,
                undefined,
                false,
                buffer
            );
        });
    });

    describe("clone", () => {
        it("should preserve irradianceTexture on both original and clone when InternalTexture is shared", () => {
            const { cubeTexture, internalTexture } = createCachedCubeTexture(engine, scene, "test-env.env");

            // Simulate what the environment texture loader does:
            // set _irradianceTexture on the InternalTexture
            const irradianceInternalTexture = new InternalTexture(engine, InternalTextureSource.RenderTarget);
            const irradianceBaseTexture = new BaseTexture(engine, irradianceInternalTexture);
            internalTexture._irradianceTexture = irradianceBaseTexture;

            // Verify irradianceTexture is set before cloning
            expect(cubeTexture.irradianceTexture).toBe(irradianceBaseTexture);

            // Clone the CubeTexture — the clone's constructor finds the same
            // InternalTexture from cache, so both share it.
            const clonedTexture = cubeTexture.clone();

            // Both original and clone should still reference the same irradianceTexture
            expect(cubeTexture.irradianceTexture).toBe(irradianceBaseTexture);
            expect(clonedTexture.irradianceTexture).toBe(irradianceBaseTexture);
        });
    });
});
