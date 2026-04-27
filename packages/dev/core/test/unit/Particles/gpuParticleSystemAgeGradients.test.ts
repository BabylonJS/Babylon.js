import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { NullEngine } from "core/Engines";
import { GPUParticleSystem } from "core/Particles/gpuParticleSystem";
import { Scene } from "core/scene";

// Side-effect import to register the WebGL2ParticleSystem class
import "core/Particles/webgl2ParticleSystem";

describe("GPUParticleSystem Emit Rate Gradients", () => {
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

    it("should add emit rate gradients sorted by position", () => {
        const ps = new GPUParticleSystem("test", { capacity: 100 }, scene);

        ps.addEmitRateGradient(0.5, 0.5);
        ps.addEmitRateGradient(0.0, 1.0);
        ps.addEmitRateGradient(1.0, 0.0);

        const gradients = ps.getEmitRateGradients();
        expect(gradients).not.toBeNull();
        expect(gradients!.length).toBe(3);
        expect(gradients![0].gradient).toBe(0.0);
        expect(gradients![1].gradient).toBe(0.5);
        expect(gradients![2].gradient).toBe(1.0);

        ps.dispose();
    });

    it("should support chaining addEmitRateGradient calls", () => {
        const ps = new GPUParticleSystem("test", { capacity: 100 }, scene);

        const result = ps.addEmitRateGradient(0.0, 1.0).addEmitRateGradient(1.0, 0.0);

        expect(result).toBe(ps);
        expect(ps.getEmitRateGradients()!.length).toBe(2);

        ps.dispose();
    });

    it("should remove an emit rate gradient", () => {
        const ps = new GPUParticleSystem("test", { capacity: 100 }, scene);

        ps.addEmitRateGradient(0.0, 1.0);
        ps.addEmitRateGradient(0.5, 0.5);
        ps.addEmitRateGradient(1.0, 0.0);

        ps.removeEmitRateGradient(0.5);

        const gradients = ps.getEmitRateGradients();
        expect(gradients!.length).toBe(2);
        expect(gradients![0].gradient).toBe(0.0);
        expect(gradients![1].gradient).toBe(1.0);

        ps.dispose();
    });

    it("should return null when no emit rate gradients are set", () => {
        const ps = new GPUParticleSystem("test", { capacity: 100 }, scene);

        expect(ps.getEmitRateGradients()).toBeNull();

        ps.dispose();
    });

    it("should throw when starting with emit rate gradients but no targetStopDuration", () => {
        const ps = new GPUParticleSystem("test", { capacity: 100 }, scene);

        ps.addEmitRateGradient(0.0, 1.0);
        ps.addEmitRateGradient(1.0, 0.0);

        expect(() => ps.start()).toThrow();

        ps.dispose();
    });

    it("should not throw when starting with emit rate gradients and targetStopDuration set", () => {
        const ps = new GPUParticleSystem("test", { capacity: 100 }, scene);

        ps.targetStopDuration = 5;
        ps.addEmitRateGradient(0.0, 1.0);
        ps.addEmitRateGradient(1.0, 0.0);

        expect(() => ps.start()).not.toThrow();

        ps.dispose();
    });

    it("should store factor2 when provided", () => {
        const ps = new GPUParticleSystem("test", { capacity: 100 }, scene);

        ps.addEmitRateGradient(0.0, 1.0, 0.8);

        const gradients = ps.getEmitRateGradients();
        expect(gradients![0].factor1).toBe(1.0);
        expect(gradients![0].factor2).toBe(0.8);

        ps.dispose();
    });

    it("should serialize and deserialize emit rate gradients", () => {
        const ps = new GPUParticleSystem("test", { capacity: 100 }, scene);

        ps.addEmitRateGradient(0.0, 1.0);
        ps.addEmitRateGradient(0.5, 0.5, 0.3);
        ps.addEmitRateGradient(1.0, 0.0);
        ps.targetStopDuration = 5;

        const serialized = ps.serialize();

        expect(serialized.emitRateGradients).toBeDefined();
        expect(serialized.emitRateGradients.length).toBe(3);
        expect(serialized.emitRateGradients[0].factor1).toBe(1.0);
        expect(serialized.emitRateGradients[1].factor2).toBe(0.3);

        const parsed = GPUParticleSystem.Parse(serialized, scene, "", true);
        const parsedGradients = parsed.getEmitRateGradients();
        expect(parsedGradients).not.toBeNull();
        expect(parsedGradients!.length).toBe(3);
        expect(parsedGradients![0].factor1).toBe(1.0);
        expect(parsedGradients![1].factor2).toBe(0.3);
        expect(parsedGradients![2].factor1).toBe(0.0);

        ps.dispose();
        parsed.dispose();
    });
});

describe("GPUParticleSystem Start Size Gradients", () => {
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

    it("should add start size gradients sorted by position", () => {
        const ps = new GPUParticleSystem("test", { capacity: 100 }, scene);

        ps.addStartSizeGradient(1.0, 0.1);
        ps.addStartSizeGradient(0.0, 1.0);

        const gradients = ps.getStartSizeGradients();
        expect(gradients).not.toBeNull();
        expect(gradients!.length).toBe(2);
        expect(gradients![0].gradient).toBe(0.0);
        expect(gradients![1].gradient).toBe(1.0);

        ps.dispose();
    });

    it("should remove a start size gradient", () => {
        const ps = new GPUParticleSystem("test", { capacity: 100 }, scene);

        ps.addStartSizeGradient(0.0, 1.0);
        ps.addStartSizeGradient(0.5, 0.5);
        ps.addStartSizeGradient(1.0, 0.1);

        ps.removeStartSizeGradient(0.5);

        const gradients = ps.getStartSizeGradients();
        expect(gradients!.length).toBe(2);

        ps.dispose();
    });

    it("should throw when starting with start size gradients but no targetStopDuration", () => {
        const ps = new GPUParticleSystem("test", { capacity: 100 }, scene);

        ps.addStartSizeGradient(0.0, 1.0);
        ps.addStartSizeGradient(1.0, 0.1);

        expect(() => ps.start()).toThrow();

        ps.dispose();
    });

    it("should serialize and deserialize start size gradients", () => {
        const ps = new GPUParticleSystem("test", { capacity: 100 }, scene);

        ps.addStartSizeGradient(0.0, 1.0);
        ps.addStartSizeGradient(1.0, 0.2, 0.1);
        ps.targetStopDuration = 5;

        const serialized = ps.serialize();

        expect(serialized.startSizeGradients).toBeDefined();
        expect(serialized.startSizeGradients.length).toBe(2);

        const parsed = GPUParticleSystem.Parse(serialized, scene, "", true);
        const parsedGradients = parsed.getStartSizeGradients();
        expect(parsedGradients).not.toBeNull();
        expect(parsedGradients!.length).toBe(2);
        expect(parsedGradients![0].factor1).toBe(1.0);
        expect(parsedGradients![1].factor2).toBe(0.1);

        ps.dispose();
        parsed.dispose();
    });
});

describe("GPUParticleSystem Life Time Gradients", () => {
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

    it("should add life time gradients sorted by position", () => {
        const ps = new GPUParticleSystem("test", { capacity: 100 }, scene);

        ps.addLifeTimeGradient(1.0, 3.0);
        ps.addLifeTimeGradient(0.0, 0.5);

        const gradients = ps.getLifeTimeGradients();
        expect(gradients).not.toBeNull();
        expect(gradients!.length).toBe(2);
        expect(gradients![0].gradient).toBe(0.0);
        expect(gradients![1].gradient).toBe(1.0);

        ps.dispose();
    });

    it("should remove a life time gradient", () => {
        const ps = new GPUParticleSystem("test", { capacity: 100 }, scene);

        ps.addLifeTimeGradient(0.0, 0.5);
        ps.addLifeTimeGradient(0.5, 1.0);
        ps.addLifeTimeGradient(1.0, 3.0);

        ps.removeLifeTimeGradient(0.5);

        const gradients = ps.getLifeTimeGradients();
        expect(gradients!.length).toBe(2);

        ps.dispose();
    });

    it("should throw when starting with life time gradients but no targetStopDuration", () => {
        const ps = new GPUParticleSystem("test", { capacity: 100 }, scene);

        ps.addLifeTimeGradient(0.0, 0.5);
        ps.addLifeTimeGradient(1.0, 3.0);

        expect(() => ps.start()).toThrow();

        ps.dispose();
    });

    it("should serialize and deserialize life time gradients", () => {
        const ps = new GPUParticleSystem("test", { capacity: 100 }, scene);

        ps.addLifeTimeGradient(0.0, 0.5);
        ps.addLifeTimeGradient(1.0, 3.0, 2.0);
        ps.targetStopDuration = 5;

        const serialized = ps.serialize();

        expect(serialized.lifeTimeGradients).toBeDefined();
        expect(serialized.lifeTimeGradients.length).toBe(2);

        const parsed = GPUParticleSystem.Parse(serialized, scene, "", true);
        const parsedGradients = parsed.getLifeTimeGradients();
        expect(parsedGradients).not.toBeNull();
        expect(parsedGradients!.length).toBe(2);
        expect(parsedGradients![0].factor1).toBe(0.5);
        expect(parsedGradients![1].factor2).toBe(2.0);

        ps.dispose();
        parsed.dispose();
    });
});
