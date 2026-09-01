import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { type Engine } from "core/Engines/engine";
import { Scene } from "core/scene";

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

    it("accepts a per-particle size buffer without throwing", () => {
        const fluidRenderer = scene.enableFluidRenderer()!;
        expect(() => fluidRenderer.addCustomParticles(makeBuffers(), 2, true)).not.toThrow();
    });

    it("builds the diffuse effect with the size attribute when per-particle sizing is enabled", () => {
        FluidRenderingObject.UsePerParticleSizeAttribute = true;

        const fluidRenderer = scene.enableFluidRenderer()!;
        const { object } = fluidRenderer.addCustomParticles(makeBuffers(), 2, true) as { object: FluidRenderingObjectCustomParticles };
        (object as any)._createEffects();

        const diffuseEffect = (object as any)._diffuseEffectWrapper.effect;

        expect((object as any)._usesPerParticleSizeAttribute).toBe(true);
        expect(diffuseEffect.getAttributesNames()).toContain("size");
        expect(diffuseEffect.defines).toContain("FLUIDRENDERING_PER_PARTICLE_SIZE");
    });

    it("builds the diffuse effect with a uniform size when per-particle sizing is disabled", () => {
        FluidRenderingObject.UsePerParticleSizeAttribute = false;

        const fluidRenderer = scene.enableFluidRenderer()!;
        const { object } = fluidRenderer.addCustomParticles(makeBuffers(), 2, true) as { object: FluidRenderingObjectCustomParticles };
        (object as any)._createEffects();

        const diffuseEffect = (object as any)._diffuseEffectWrapper.effect;

        expect((object as any)._usesPerParticleSizeAttribute).toBe(false);
        expect(diffuseEffect.getAttributesNames()).not.toContain("size");
        expect(diffuseEffect.defines).not.toContain("FLUIDRENDERING_PER_PARTICLE_SIZE");
    });
});
