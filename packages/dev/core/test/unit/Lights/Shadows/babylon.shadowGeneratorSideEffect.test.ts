import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Pre-load shader modules that ShadowGenerator dynamically imports during construction.
// Without these, the fire-and-forget import() in _initShaderSourceAsync may still be
// resolving when the test environment tears down, causing EnvironmentTeardownError.
import "core/Shaders/shadowMap.fragment";
import "core/Shaders/shadowMap.vertex";
import "core/Shaders/depthBoxBlur.fragment";
import "core/Shaders/ShadersInclude/shadowMapFragmentSoftTransparentShadow";

/**
 * Regression coverage for the 9.15 tree-shaking split where PCF/PCSS shadows threw
 * `Sampler "shadowTexture0Sampler" not found in the material context` on WebGPU.
 *
 * `ShadowGenerator.bindShadowLight` calls `effect.setDepthStencilTexture(...)` for
 * PCF and PCSS filtering, but that method is only installed by the render target
 * texture registration. Because the shadow modules import `renderTargetTexture.pure`
 * (no side effects), the method stayed unregistered and the comparison sampler was
 * never bound. Constructing a ShadowGenerator (or CascadedShadowGenerator) must
 * therefore trigger the render target texture registration at runtime.
 */
describe("ShadowGenerator setDepthStencilTexture side effect", () => {
    beforeEach(() => {
        vi.resetModules();
    });

    afterEach(() => {
        vi.resetModules();
    });

    it("does not install setDepthStencilTexture merely by importing the shadow module", async () => {
        const { Effect } = await import("core/Materials/effect");
        expect(Effect.prototype.setDepthStencilTexture).toBeUndefined();

        // Importing the module (which pulls in renderTargetTexture.pure) must not have side effects.
        await import("core/Lights/Shadows/shadowGenerator");
        expect(Effect.prototype.setDepthStencilTexture).toBeUndefined();
    });

    it("installs setDepthStencilTexture when a ShadowGenerator is constructed", async () => {
        const { Effect } = await import("core/Materials/effect");
        const { NullEngine } = await import("core/Engines/nullEngine");
        const { Scene } = await import("core/scene");
        const { DirectionalLight } = await import("core/Lights/directionalLight");
        const { Vector3 } = await import("core/Maths/math.vector");
        const { ShadowGenerator } = await import("core/Lights/Shadows/shadowGenerator");

        expect(Effect.prototype.setDepthStencilTexture).toBeUndefined();

        const engine = new NullEngine({ renderHeight: 256, renderWidth: 256, textureSize: 256, deterministicLockstep: false, lockstepMaxSteps: 1 });
        try {
            const scene = new Scene(engine);
            const light = new DirectionalLight("dir", new Vector3(0, -1, 0), scene);
            const generator = new ShadowGenerator(1024, light);
            generator.usePercentageCloserFiltering = true;

            expect(typeof Effect.prototype.setDepthStencilTexture).toBe("function");
        } finally {
            engine.dispose();
        }
    });
});
