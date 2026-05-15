import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { type Engine, NullEngine } from "core/Engines";
import { BaseTexture, CubeTexture, InternalTexture } from "core/Materials";
import { InternalTextureSource } from "core/Materials/Textures/internalTexture";
import { Scene } from "core/scene";

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
        scene.dispose();
        engine.dispose();
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
