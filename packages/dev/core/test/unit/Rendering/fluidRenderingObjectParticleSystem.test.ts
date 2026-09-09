import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { type Engine } from "core/Engines/engine";
import { Scene } from "core/scene";
import { ArcRotateCamera } from "core/Cameras/arcRotateCamera";
import { Vector3 } from "core/Maths/math.vector";
import { ParticleSystem } from "core/Particles/particleSystem";
import { GPUParticleSystem } from "core/Particles/gpuParticleSystem";
import { Logger } from "core/Misc/logger";

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

    it("uses the per-particle size attribute when wrapping a CPU ParticleSystem", () => {
        FluidRenderingObject.UsePerParticleSizeAttribute = true;

        const ps = new ParticleSystem("test", 100, scene);
        const fluidRenderer = scene.enableFluidRenderer()!;
        const { object } = fluidRenderer.addParticleSystem(ps, false) as { object: FluidRenderingObjectParticleSystem };

        expect((object as any)._supportsPerParticleSizeAttribute()).toBe(true);

        (object as any)._createEffects();
        const depthEffect = (object as any)._depthEffectWrapper.effect;

        expect((object as any)._usesPerParticleSizeAttribute).toBe(true);
        expect(depthEffect.getAttributesNames()).toContain("size");
        expect(depthEffect.defines).toContain("FLUIDRENDERING_PER_PARTICLE_SIZE");
    });

    it("falls back to a uniform size and warns when wrapping a GPUParticleSystem", () => {
        FluidRenderingObject.UsePerParticleSizeAttribute = true;

        const warnSpy = vi.spyOn(Logger, "Warn").mockImplementation(() => {});

        const ps = new GPUParticleSystem("test", { capacity: 100 }, scene);
        const fluidRenderer = scene.enableFluidRenderer()!;
        const { object } = fluidRenderer.addParticleSystem(ps, false) as { object: FluidRenderingObjectParticleSystem };

        expect((object as any)._supportsPerParticleSizeAttribute()).toBe(false);
        expect(warnSpy).toHaveBeenCalled();

        (object as any)._createEffects();
        const depthEffect = (object as any)._depthEffectWrapper.effect;

        expect((object as any)._usesPerParticleSizeAttribute).toBe(false);
        expect(depthEffect.getAttributesNames()).not.toContain("size");
        expect(depthEffect.defines).not.toContain("FLUIDRENDERING_PER_PARTICLE_SIZE");

        warnSpy.mockRestore();
    });
});
