import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { type Engine } from "core/Engines/engine";
import { Scene } from "core/scene";
import { ArcRotateCamera } from "core/Cameras/arcRotateCamera";
import { Vector3 } from "core/Maths/math.vector";
import { ParticleSystem } from "core/Particles/particleSystem";
import { GPUParticleSystem } from "core/Particles/gpuParticleSystem";

import "core/Rendering/fluidRenderer/fluidRenderer";
import "core/Particles/webgl2ParticleSystem";
import "core/Shaders/fluidRenderingParticleDepth.vertex";
import "core/Shaders/fluidRenderingParticleDepth.fragment";
import "core/Shaders/fluidRenderingParticleThickness.vertex";
import "core/Shaders/fluidRenderingParticleThickness.fragment";

import { FluidRenderingObject } from "core/Rendering/fluidRenderer/fluidRenderingObject";
import { type FluidRenderingObjectParticleSystem } from "core/Rendering/fluidRenderer/fluidRenderingObjectParticleSystem";

describe("FluidRenderingObjectParticleSystem", () => {
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
        scene.setTransformMatrix(camera.getViewMatrix(), camera.getProjectionMatrix());
    });

    afterEach(() => {
        FluidRenderingObject.UsePerParticleSizeAttribute = false;
        scene.dispose();
        engine.dispose();
    });

    it("uses a vec2 per-particle size attribute when wrapping a CPU ParticleSystem", () => {
        FluidRenderingObject.UsePerParticleSizeAttribute = true;

        const ps = new ParticleSystem("test", 100, scene);
        const fluidRenderer = scene.enableFluidRenderer()!;
        const { object } = fluidRenderer.addParticleSystem(ps, false) as { object: FluidRenderingObjectParticleSystem };

        (object as any)._createEffects();

        expect((object as any)._usesPerParticleSizeAttribute).toBe(true);
        for (const wrapper of ["_depthEffectWrapper", "_thicknessEffectWrapper"]) {
            const effect = (object as any)[wrapper].effect;
            expect(effect.getAttributesNames()).toContain("size");
            expect(effect.defines).toContain("FLUIDRENDERING_PER_PARTICLE_SIZE");
            expect(effect.defines).not.toContain("FLUIDRENDERING_PER_PARTICLE_SIZE_VEC3");
            expect(effect.defines).not.toContain("FLUIDRENDERING_CENTERED_OFFSET");
        }
    });

    it("uses a vec3 per-particle size attribute when wrapping a GPUParticleSystem", () => {
        FluidRenderingObject.UsePerParticleSizeAttribute = true;

        const ps = new GPUParticleSystem("test", { capacity: 100 }, scene);
        const fluidRenderer = scene.enableFluidRenderer()!;
        const { object } = fluidRenderer.addParticleSystem(ps, false) as { object: FluidRenderingObjectParticleSystem };

        (object as any)._createEffects();

        expect((object as any)._usesPerParticleSizeAttribute).toBe(true);
        for (const wrapper of ["_depthEffectWrapper", "_thicknessEffectWrapper"]) {
            const effect = (object as any)[wrapper].effect;
            expect(effect.getAttributesNames()).toContain("size");
            expect(effect.defines).toContain("FLUIDRENDERING_PER_PARTICLE_SIZE_VEC3");
            expect(effect.defines).toContain("FLUIDRENDERING_CENTERED_OFFSET");
        }
    });

    it("keeps size as a uniform for a GPUParticleSystem when the feature is disabled", () => {
        const ps = new GPUParticleSystem("test", { capacity: 100 }, scene);
        const fluidRenderer = scene.enableFluidRenderer()!;
        const { object } = fluidRenderer.addParticleSystem(ps, false) as { object: FluidRenderingObjectParticleSystem };

        (object as any)._createEffects();
        const depthEffect = (object as any)._depthEffectWrapper.effect;

        expect((object as any)._usesPerParticleSizeAttribute).toBe(false);
        expect(depthEffect.getAttributesNames()).not.toContain("size");
        expect(depthEffect.defines).not.toContain("FLUIDRENDERING_PER_PARTICLE_SIZE");
        expect(depthEffect.defines).toContain("FLUIDRENDERING_CENTERED_OFFSET");
    });
});
