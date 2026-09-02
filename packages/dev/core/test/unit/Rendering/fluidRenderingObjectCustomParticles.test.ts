import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { type Engine } from "core/Engines/engine";
import { Scene } from "core/scene";
import { ArcRotateCamera } from "core/Cameras/arcRotateCamera";
import { Vector3 } from "core/Maths/math.vector";

import "core/Rendering/fluidRenderer/fluidRenderer";
import "core/Shaders/fluidRenderingParticleDepth.vertex";
import "core/Shaders/fluidRenderingParticleDepth.fragment";
import "core/Shaders/fluidRenderingParticleThickness.vertex";
import "core/Shaders/fluidRenderingParticleThickness.fragment";
import "core/Shaders/fluidRenderingParticleDiffuse.vertex";
import "core/Shaders/fluidRenderingParticleDiffuse.fragment";

import { FluidRenderingObject } from "core/Rendering/fluidRenderer/fluidRenderingObject";
import { type FluidRenderingObjectCustomParticles } from "core/Rendering/fluidRenderer/fluidRenderingObjectCustomParticles";

describe("FluidRenderingObjectCustomParticles", () => {
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
        const camera = new ArcRotateCamera("camera", 0, 0, 10, Vector3.Zero(), scene);
        scene.activeCamera = camera;
        // getViewMatrix() is undefined until this is called at least once.
        scene.setTransformMatrix(camera.getViewMatrix(), camera.getProjectionMatrix());
    });

    afterEach(() => {
        FluidRenderingObject.UsePerParticleSizeAttribute = false;
        scene.dispose();
        engine.dispose();
    });

    function makeBuffers() {
        return {
            position: new Float32Array([0, 0, 0, 1, 1, 1]),
            size: new Float32Array([0.1, 0.1, 0.2, 0.2]),
            color: new Float32Array([1, 0, 0, 1, 0, 1, 0, 1]),
        };
    }

    function makeBuffersWithoutSize() {
        return {
            position: new Float32Array([0, 0, 0, 1, 1, 1]),
            color: new Float32Array([1, 0, 0, 1, 0, 1, 0, 1]),
        };
    }

    // NullEngine compiles shaders asynchronously; poll until isReady() settles.
    async function pollIsReady(object: FluidRenderingObjectCustomParticles): Promise<boolean> {
        for (let i = 0; i < 20; i++) {
            if (object.isReady()) {
                return true;
            }
            await new Promise((resolve) => setTimeout(resolve, 0));
        }
        return false;
    }

    it("accepts a per-particle size buffer without throwing", () => {
        const fluidRenderer = scene.enableFluidRenderer()!;
        expect(() => fluidRenderer.addCustomParticles(makeBuffers(), 2, true)).not.toThrow();
    });

    it("binds size as a per-particle attribute across all passes when enabled", async () => {
        FluidRenderingObject.UsePerParticleSizeAttribute = true;

        const fluidRenderer = scene.enableFluidRenderer()!;
        const { object } = fluidRenderer.addCustomParticles(makeBuffers(), 2, true) as { object: FluidRenderingObjectCustomParticles };

        expect(await pollIsReady(object)).toBe(true);
        expect((object as any)._usesPerParticleSizeAttribute).toBe(true);

        for (const wrapper of ["_depthEffectWrapper", "_thicknessEffectWrapper", "_diffuseEffectWrapper"]) {
            const effect = (object as any)[wrapper].effect;
            expect(effect.getAttributesNames()).toContain("size");
            expect(effect.defines).toContain("FLUIDRENDERING_PER_PARTICLE_SIZE");
        }

        expect(() => object.renderDepthTexture()).not.toThrow();
        expect(() => object.renderThicknessTexture()).not.toThrow();
        expect(() => object.renderDiffuseTexture()).not.toThrow();
    });

    it("binds size as a uniform across all passes when disabled", async () => {
        FluidRenderingObject.UsePerParticleSizeAttribute = false;

        const fluidRenderer = scene.enableFluidRenderer()!;
        const { object } = fluidRenderer.addCustomParticles(makeBuffers(), 2, true) as { object: FluidRenderingObjectCustomParticles };

        expect(await pollIsReady(object)).toBe(true);
        expect((object as any)._usesPerParticleSizeAttribute).toBe(false);

        for (const wrapper of ["_depthEffectWrapper", "_thicknessEffectWrapper", "_diffuseEffectWrapper"]) {
            const effect = (object as any)[wrapper].effect;
            expect(effect.getAttributesNames()).not.toContain("size");
            expect(effect.defines).not.toContain("FLUIDRENDERING_PER_PARTICLE_SIZE");
        }

        expect(() => object.renderDepthTexture()).not.toThrow();
        expect(() => object.renderThicknessTexture()).not.toThrow();
        expect(() => object.renderDiffuseTexture()).not.toThrow();
    });

    it("falls back to a uniform size when no size buffer was supplied, even with per-particle sizing enabled", async () => {
        FluidRenderingObject.UsePerParticleSizeAttribute = true;

        const fluidRenderer = scene.enableFluidRenderer()!;
        const { object } = fluidRenderer.addCustomParticles(makeBuffersWithoutSize(), 2, true) as { object: FluidRenderingObjectCustomParticles };

        expect(await pollIsReady(object)).toBe(true);

        expect((object as any)._usesPerParticleSizeAttribute).toBe(false);
        expect((object as any)._diffuseEffectWrapper.effect.getAttributesNames()).not.toContain("size");

        expect(() => object.renderDepthTexture()).not.toThrow();
        expect(() => object.renderThicknessTexture()).not.toThrow();
        expect(() => object.renderDiffuseTexture()).not.toThrow();
    });

    it("switches to the per-particle size attribute once a size buffer is added later", async () => {
        FluidRenderingObject.UsePerParticleSizeAttribute = true;

        const fluidRenderer = scene.enableFluidRenderer()!;
        const { object } = fluidRenderer.addCustomParticles(makeBuffersWithoutSize(), 2, true) as { object: FluidRenderingObjectCustomParticles };

        expect(await pollIsReady(object)).toBe(true);
        expect((object as any)._usesPerParticleSizeAttribute).toBe(false);

        object.addBuffers({ size: new Float32Array([0.1, 0.1, 0.2, 0.2]) });

        expect(await pollIsReady(object)).toBe(true);
        expect((object as any)._usesPerParticleSizeAttribute).toBe(true);
        expect((object as any)._diffuseEffectWrapper.effect.getAttributesNames()).toContain("size");
    });
});
