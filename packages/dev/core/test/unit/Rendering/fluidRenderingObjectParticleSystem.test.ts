import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { type Engine } from "core/Engines/engine";
import { Scene } from "core/scene";
import { ArcRotateCamera } from "core/Cameras/arcRotateCamera";
import { Vector3 } from "core/Maths/math.vector";
import { ParticleSystem } from "core/Particles/particleSystem";
import { GPUParticleSystem } from "core/Particles/gpuParticleSystem";
import { VertexBuffer } from "core/Buffers/buffer";

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
    });

    for (const perParticleSize of [true, false]) {
        it(`recreates the GPUParticleSystem offset buffer after a context restoration (per-particle size ${perParticleSize ? "on" : "off"})`, () => {
            FluidRenderingObject.UsePerParticleSizeAttribute = perParticleSize;

            const ps = new GPUParticleSystem("test", { capacity: 100 }, scene);
            // NullEngine cannot build the GPU particle VAOs, so emulate the buffers the system exposes after a (re)initialization
            const makeBuffers = () => ({
                offset: new VertexBuffer(engine, [0.5, 0.5, 1, 1, -0.5, 0.5, 0, 1, -0.5, -0.5, 0, 0, 0.5, -0.5, 1, 0], "offset", false, false, 4),
                position: new VertexBuffer(engine, new Float32Array(300), "position", false, false, 3),
                size: new VertexBuffer(engine, new Float32Array(300), "size", false, false, 3),
            });
            let systemBuffers = makeBuffers();
            Object.defineProperty(ps, "vertexBuffers", { get: () => systemBuffers });
            ps.rebuild = () => {
                systemBuffers = makeBuffers();
            };

            const fluidRenderer = scene.enableFluidRenderer()!;
            const { object } = fluidRenderer.addParticleSystem(ps, false) as { object: FluidRenderingObjectParticleSystem };

            const buffersBefore = object.vertexBuffers;
            const offsetBefore = buffersBefore.offset;
            const handleBefore = offsetBefore.getBuffer();

            expect(offsetBefore).not.toBe(systemBuffers.offset);
            expect(buffersBefore.position).toBe(systemBuffers.position);
            expect(handleBefore).not.toBeNull();

            scene._rebuildGeometries();

            const buffersAfter = object.vertexBuffers;

            expect(buffersAfter).not.toBe(buffersBefore);
            expect(buffersAfter.position).toBe(systemBuffers.position);
            expect(buffersAfter.offset).toBe(offsetBefore);
            expect(buffersAfter.offset.getBuffer()).not.toBe(handleBefore);
            expect(buffersAfter.offset.getBuffer()).not.toBeNull();
        });
    }
});
