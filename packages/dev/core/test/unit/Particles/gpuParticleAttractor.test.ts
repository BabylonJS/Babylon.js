import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NullEngine } from "core/Engines";
import { Vector3 } from "core/Maths";
import { Attractor } from "core/Particles/attractor";
import { GPUParticleSystem } from "core/Particles/gpuParticleSystem";
import { Scene } from "core/scene";
import { Logger } from "core/Misc/logger";

// Side-effect import to register the WebGL2ParticleSystem class
import "core/Particles/webgl2ParticleSystem";

describe("GPUParticleSystem Attractors", () => {
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

    it("should add and retrieve attractors", () => {
        const ps = new GPUParticleSystem("test", { capacity: 100 }, scene);
        const attractor = new Attractor();
        attractor.position = new Vector3(1, 2, 3);
        attractor.strength = 50;

        ps.addAttractor(attractor);

        expect(ps.attractors.length).toBe(1);
        expect(ps.attractors[0].position.x).toBe(1);
        expect(ps.attractors[0].position.y).toBe(2);
        expect(ps.attractors[0].position.z).toBe(3);
        expect(ps.attractors[0].strength).toBe(50);

        ps.dispose();
    });

    it("should return a copy from the attractors getter", () => {
        const ps = new GPUParticleSystem("test", { capacity: 100 }, scene);
        const attractor = new Attractor();
        attractor.strength = 10;

        ps.addAttractor(attractor);

        const copy = ps.attractors;
        copy.push(new Attractor());
        expect(ps.attractors.length).toBe(1);

        ps.dispose();
    });

    it("should remove an attractor", () => {
        const ps = new GPUParticleSystem("test", { capacity: 100 }, scene);
        const a1 = new Attractor();
        a1.strength = 10;
        const a2 = new Attractor();
        a2.strength = 20;

        ps.addAttractor(a1);
        ps.addAttractor(a2);
        expect(ps.attractors.length).toBe(2);

        ps.removeAttractor(a1);
        expect(ps.attractors.length).toBe(1);
        expect(ps.attractors[0].strength).toBe(20);

        ps.dispose();
    });

    it("should not fail when removing a non-existent attractor", () => {
        const ps = new GPUParticleSystem("test", { capacity: 100 }, scene);
        const attractor = new Attractor();

        ps.removeAttractor(attractor);
        expect(ps.attractors.length).toBe(0);

        ps.dispose();
    });

    it("should warn and ignore attractors beyond the limit of 8", () => {
        const ps = new GPUParticleSystem("test", { capacity: 100 }, scene);
        const warnSpy = vi.spyOn(Logger, "Warn");

        for (let i = 0; i < 8; i++) {
            const a = new Attractor();
            a.strength = i;
            ps.addAttractor(a);
        }
        expect(ps.attractors.length).toBe(8);
        expect(warnSpy).not.toHaveBeenCalled();

        // 9th attractor should be rejected
        const extra = new Attractor();
        extra.strength = 99;
        ps.addAttractor(extra);
        expect(ps.attractors.length).toBe(8);
        expect(warnSpy).toHaveBeenCalledTimes(1);

        warnSpy.mockRestore();
        ps.dispose();
    });

    it("should serialize and deserialize attractors", () => {
        const ps = new GPUParticleSystem("test", { capacity: 100 }, scene);
        const a1 = new Attractor();
        a1.position = new Vector3(1, 2, 3);
        a1.strength = 50;
        const a2 = new Attractor();
        a2.position = new Vector3(4, 5, 6);
        a2.strength = -30;

        ps.addAttractor(a1);
        ps.addAttractor(a2);

        const serialized = ps.serialize();
        expect(serialized.attractors).toBeDefined();
        expect(serialized.attractors.length).toBe(2);
        expect(serialized.attractors[0].position).toEqual([1, 2, 3]);
        expect(serialized.attractors[0].strength).toBe(50);
        expect(serialized.attractors[1].position).toEqual([4, 5, 6]);
        expect(serialized.attractors[1].strength).toBe(-30);

        const parsed = GPUParticleSystem.Parse(serialized, scene, "", true);
        expect(parsed.attractors.length).toBe(2);
        expect(parsed.attractors[0].position.x).toBe(1);
        expect(parsed.attractors[0].position.y).toBe(2);
        expect(parsed.attractors[0].position.z).toBe(3);
        expect(parsed.attractors[0].strength).toBe(50);
        expect(parsed.attractors[1].position.x).toBe(4);
        expect(parsed.attractors[1].position.y).toBe(5);
        expect(parsed.attractors[1].position.z).toBe(6);
        expect(parsed.attractors[1].strength).toBe(-30);

        ps.dispose();
        parsed.dispose();
    });

    it("should not serialize attractors when empty", () => {
        const ps = new GPUParticleSystem("test", { capacity: 100 }, scene);
        const serialized = ps.serialize();
        expect(serialized.attractors).toBeUndefined();

        ps.dispose();
    });
});
