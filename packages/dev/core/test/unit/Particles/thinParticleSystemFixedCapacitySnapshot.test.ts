import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { Color4 } from "core/Maths/math.color";
import { Vector3 } from "core/Maths/math.vector";
import { Particle } from "core/Particles/particle";
import { ParticleSystem } from "core/Particles/particleSystem";
import { Scene } from "core/scene";

import "core/Shaders/particles.vertex";
import "core/Shaders/particles.fragment";

type FixedCapacitySnapshotInternals = ParticleSystem & {
    _clearFixedCapacitySnapshotData: () => void;
    _fixedCapacityHighWaterMark: number;
    _render: (blendMode: number) => number;
    _useFixedCapacityForSnapshot: boolean;
    _vertexBufferSize: number;
    _vertexData: Float32Array;
};

describe("ThinParticleSystem fixed-capacity snapshot rendering", () => {
    let engine: NullEngine;
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

    const asFixedCapacityInternals = (particleSystem: ParticleSystem): FixedCapacitySnapshotInternals => {
        return particleSystem as unknown as FixedCapacitySnapshotInternals;
    };

    const createSystem = (capacity = 4): ParticleSystem => {
        const particleSystem = new ParticleSystem("fixedCapacity", capacity, scene);
        particleSystem.emitter = Vector3.Zero();
        particleSystem.emitRate = 0;
        particleSystem.manualEmitCount = 0;
        particleSystem.minLifeTime = 100;
        particleSystem.maxLifeTime = 100;
        particleSystem.minSize = 1;
        particleSystem.maxSize = 1;
        particleSystem.updateFunction = () => {};
        (particleSystem as unknown as { isReady: () => boolean }).isReady = () => true;
        particleSystem.start();

        return particleSystem;
    };

    const createParticle = (particleSystem: ParticleSystem, index: number): Particle => {
        const particle = new Particle(particleSystem);
        particle.position = new Vector3(index + 1, index + 2, index + 3);
        particle.color = new Color4(1, index / 10, 0.5, 1);
        particle.size = index + 1;
        particle.scale.set(1, 1);

        return particle;
    };

    const setFrameId = (frameId: number): void => {
        (scene as unknown as { _frameId: number })._frameId = frameId;
    };

    const getParticleStride = (internals: FixedCapacitySnapshotInternals): number => {
        return internals._vertexBufferSize * 4;
    };

    const expectLastUploadToUseFullCapacity = (internals: FixedCapacitySnapshotInternals, updateSpy: ReturnType<typeof vi.spyOn>): void => {
        const expectedByteLength = internals.getCapacity() * getParticleStride(internals) * Float32Array.BYTES_PER_ELEMENT;
        expect(updateSpy).toHaveBeenLastCalledWith(expect.anything(), internals._vertexData, 0, expectedByteLength);
    };

    it("uploads at full capacity and clears inactive slots when the active count shrinks", () => {
        const particleSystem = createSystem();
        const internals = asFixedCapacityInternals(particleSystem);
        internals._useFixedCapacityForSnapshot = true;
        const updateSpy = vi.spyOn(engine, "updateDynamicVertexBuffer").mockImplementation(() => {});

        particleSystem.particles.push(createParticle(particleSystem, 0), createParticle(particleSystem, 1), createParticle(particleSystem, 2));
        setFrameId(1);
        particleSystem.animate();

        const particleStride = getParticleStride(internals);
        expectLastUploadToUseFullCapacity(internals, updateSpy);
        expect(internals._fixedCapacityHighWaterMark).toBe(3);
        expect(internals._vertexData.slice(0, 3 * particleStride).some((value) => value !== 0)).toBe(true);
        expect(internals._vertexData.slice(3 * particleStride).every((value) => value === 0)).toBe(true);

        particleSystem.particles.length = 1;
        setFrameId(2);
        particleSystem.animate();

        expectLastUploadToUseFullCapacity(internals, updateSpy);
        expect(internals._vertexData.slice(particleStride, 3 * particleStride).every((value) => value === 0)).toBe(true);
    });

    it("uploads a full-capacity buffer when emission moves from empty to non-empty", () => {
        const particleSystem = createSystem();
        const internals = asFixedCapacityInternals(particleSystem);
        internals._useFixedCapacityForSnapshot = true;
        const updateSpy = vi.spyOn(engine, "updateDynamicVertexBuffer").mockImplementation(() => {});

        setFrameId(1);
        particleSystem.animate();

        const particleStride = getParticleStride(internals);
        expect(particleSystem.particles.length).toBe(0);
        expectLastUploadToUseFullCapacity(internals, updateSpy);
        expect(internals._vertexData.every((value) => value === 0)).toBe(true);

        particleSystem.manualEmitCount = 1;
        setFrameId(2);
        particleSystem.animate();

        expect(particleSystem.particles.length).toBe(1);
        expectLastUploadToUseFullCapacity(internals, updateSpy);
        expect(internals._fixedCapacityHighWaterMark).toBe(1);
        expect(internals._vertexData.slice(0, particleStride).some((value) => value !== 0)).toBe(true);
    });

    it("clears uploaded fixed-capacity data for disabled snapshot gates", () => {
        const particleSystem = createSystem();
        const internals = asFixedCapacityInternals(particleSystem);
        internals._useFixedCapacityForSnapshot = true;
        const updateSpy = vi.spyOn(engine, "updateDynamicVertexBuffer").mockImplementation(() => {});

        particleSystem.particles.push(createParticle(particleSystem, 0), createParticle(particleSystem, 1));
        setFrameId(1);
        particleSystem.animate();

        const particleStride = getParticleStride(internals);
        expect(internals._vertexData.slice(0, 2 * particleStride).some((value) => value !== 0)).toBe(true);

        updateSpy.mockClear();
        internals._clearFixedCapacitySnapshotData();

        expect(internals._fixedCapacityHighWaterMark).toBe(0);
        expect(internals._vertexData.slice(0, 2 * particleStride).every((value) => value === 0)).toBe(true);
        expectLastUploadToUseFullCapacity(internals, updateSpy);

        updateSpy.mockClear();
        internals._clearFixedCapacitySnapshotData();

        expect(updateSpy).not.toHaveBeenCalled();
    });

    it("does not skip the render path when fixed-capacity systems have no live particles", () => {
        const particleSystem = createSystem();
        const internals = asFixedCapacityInternals(particleSystem);
        const renderSpy = vi.fn(() => 7);
        internals._render = renderSpy;

        expect(particleSystem.render()).toBe(0);
        expect(renderSpy).not.toHaveBeenCalled();

        internals._useFixedCapacityForSnapshot = true;

        expect(particleSystem.render()).toBe(7);
        expect(renderSpy).toHaveBeenCalledWith(particleSystem.blendMode);
    });
});
