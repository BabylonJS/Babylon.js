import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { Vector2, Vector3 } from "core/Maths/math.vector";
import { Color3, Color4 } from "core/Maths/math.color";
import { Attractor } from "core/Particles/attractor";
import { GPUParticleSystem } from "core/Particles/gpuParticleSystem";
import { ParticleSystem } from "core/Particles/particleSystem";
import { FlowMap } from "core/Particles/flowMap";
import { SphereParticleEmitter } from "core/Particles/EmitterTypes/sphereParticleEmitter";
import { Scene } from "core/scene";
import { Logger } from "core/Misc/logger";

// Side-effect import to register the WebGL2ParticleSystem class
import "core/Particles/webgl2ParticleSystem";

describe("GPUParticleSystem.fromParticleSystem", () => {
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

    const createSourceSystem = () => {
        const cpu = new ParticleSystem("source", 500, scene);
        cpu.id = "cpu-id";
        cpu.emitter = new Vector3(1, 2, 3);
        cpu.particleEmitterType = new SphereParticleEmitter(2, 0.5);

        cpu.color1 = new Color4(1, 0, 0, 1);
        cpu.color2 = new Color4(0, 1, 0, 1);
        cpu.colorDead = new Color4(0, 0, 1, 0);
        cpu.textureMask = new Color4(0.5, 0.5, 0.5, 1);

        cpu.minSize = 0.25;
        cpu.maxSize = 1.5;
        cpu.minScaleX = 0.1;
        cpu.maxScaleX = 0.2;
        cpu.minScaleY = 0.3;
        cpu.maxScaleY = 0.4;

        cpu.minEmitPower = 2;
        cpu.maxEmitPower = 5;
        cpu.minAngularSpeed = 0.1;
        cpu.maxAngularSpeed = 1.1;
        cpu.minInitialRotation = 0.2;
        cpu.maxInitialRotation = 1.2;

        cpu.minLifeTime = 0.7;
        cpu.maxLifeTime = 2.3;

        cpu.emitRate = 77;
        cpu.manualEmitCount = 42;

        cpu.gravity = new Vector3(0, -9.81, 0);
        cpu.limitVelocityDamping = 0.6;

        cpu.blendMode = ParticleSystem.BLENDMODE_ADD;
        cpu.isBillboardBased = false;
        cpu.forceDepthWrite = true;
        cpu.renderingGroupId = 1;
        cpu.layerMask = 0x0f000000;

        cpu.startSpriteCellID = 1;
        cpu.endSpriteCellID = 3;
        cpu.spriteCellWidth = 16;
        cpu.spriteCellHeight = 32;
        cpu.spriteCellChangeSpeed = 0.5;
        cpu.spriteCellLoop = false;
        cpu.spriteRandomStartCell = true;

        cpu.isLocal = true;
        cpu.worldOffset = new Vector3(7, 8, 9);
        cpu.translationPivot = new Vector2(0.5, 0.25);

        cpu.targetStopDuration = 4.5;
        cpu.disposeOnStop = true;
        cpu.startDelay = 250;
        cpu.preWarmCycles = 5;
        cpu.preWarmStepOffset = 2;
        cpu.updateSpeed = 0.02;
        cpu.preventAutoStart = true;

        cpu.noiseStrength = new Vector3(3, 4, 5);

        cpu.addColorGradient(0.0, new Color4(1, 1, 1, 1));
        cpu.addColorGradient(1.0, new Color4(0, 0, 0, 0));
        cpu.addSizeGradient(0.0, 1.0, 2.0);
        cpu.addSizeGradient(1.0, 0.5);
        cpu.addAngularSpeedGradient(0.5, 1.5);
        cpu.addVelocityGradient(0.5, 2.0);
        cpu.addLimitVelocityGradient(0.5, 1.0);
        cpu.addDragGradient(0.5, 0.3);
        cpu.addEmitRateGradient(0.0, 100);
        cpu.addEmitRateGradient(1.0, 10);
        cpu.addStartSizeGradient(0.0, 0.5);
        cpu.addLifeTimeGradient(0.5, 1.5, 2.5);

        const attractor = new Attractor();
        attractor.position = new Vector3(4, 5, 6);
        attractor.strength = 12;
        cpu.addAttractor(attractor);

        return cpu;
    };

    it("should copy all shared scalar and vector properties", () => {
        const cpu = createSourceSystem();
        const gpu = GPUParticleSystem.fromParticleSystem(cpu, scene);

        expect(gpu).toBeInstanceOf(GPUParticleSystem);
        expect(gpu.name).toBe("source (GPU)");
        expect(gpu.id).toBe("cpu-id");

        expect((gpu.emitter as Vector3).equals(cpu.emitter as Vector3)).toBe(true);
        expect(gpu.particleEmitterType).toBeInstanceOf(SphereParticleEmitter);

        expect(gpu.color1.equals(cpu.color1)).toBe(true);
        expect(gpu.color2.equals(cpu.color2)).toBe(true);
        expect(gpu.colorDead.equals(cpu.colorDead)).toBe(true);
        expect(gpu.textureMask.equals(cpu.textureMask)).toBe(true);

        expect(gpu.minSize).toBe(cpu.minSize);
        expect(gpu.maxSize).toBe(cpu.maxSize);
        expect(gpu.minScaleX).toBe(cpu.minScaleX);
        expect(gpu.maxScaleX).toBe(cpu.maxScaleX);
        expect(gpu.minScaleY).toBe(cpu.minScaleY);
        expect(gpu.maxScaleY).toBe(cpu.maxScaleY);

        expect(gpu.minEmitPower).toBe(cpu.minEmitPower);
        expect(gpu.maxEmitPower).toBe(cpu.maxEmitPower);
        expect(gpu.minAngularSpeed).toBe(cpu.minAngularSpeed);
        expect(gpu.maxAngularSpeed).toBe(cpu.maxAngularSpeed);
        expect(gpu.minInitialRotation).toBe(cpu.minInitialRotation);
        expect(gpu.maxInitialRotation).toBe(cpu.maxInitialRotation);

        expect(gpu.minLifeTime).toBe(cpu.minLifeTime);
        expect(gpu.maxLifeTime).toBe(cpu.maxLifeTime);

        expect(gpu.emitRate).toBe(cpu.emitRate);
        expect(gpu.manualEmitCount).toBe(cpu.manualEmitCount);

        expect(gpu.gravity.equals(cpu.gravity)).toBe(true);
        expect(gpu.limitVelocityDamping).toBe(cpu.limitVelocityDamping);

        expect(gpu.blendMode).toBe(cpu.blendMode);
        expect(gpu.isBillboardBased).toBe(cpu.isBillboardBased);
        expect(gpu.forceDepthWrite).toBe(cpu.forceDepthWrite);
        expect(gpu.renderingGroupId).toBe(cpu.renderingGroupId);
        expect(gpu.layerMask).toBe(cpu.layerMask);

        expect(gpu.startSpriteCellID).toBe(cpu.startSpriteCellID);
        expect(gpu.endSpriteCellID).toBe(cpu.endSpriteCellID);
        expect(gpu.spriteCellWidth).toBe(cpu.spriteCellWidth);
        expect(gpu.spriteCellHeight).toBe(cpu.spriteCellHeight);
        expect(gpu.spriteCellChangeSpeed).toBe(cpu.spriteCellChangeSpeed);
        expect(gpu.spriteCellLoop).toBe(cpu.spriteCellLoop);
        expect(gpu.spriteRandomStartCell).toBe(cpu.spriteRandomStartCell);

        expect(gpu.isLocal).toBe(cpu.isLocal);
        expect(gpu.worldOffset.equals(cpu.worldOffset)).toBe(true);
        expect(gpu.translationPivot.equals(cpu.translationPivot)).toBe(true);

        expect(gpu.targetStopDuration).toBe(cpu.targetStopDuration);
        expect(gpu.disposeOnStop).toBe(cpu.disposeOnStop);
        expect(gpu.startDelay).toBe(cpu.startDelay);
        expect(gpu.preWarmCycles).toBe(cpu.preWarmCycles);
        expect(gpu.preWarmStepOffset).toBe(cpu.preWarmStepOffset);
        expect(gpu.updateSpeed).toBe(cpu.updateSpeed);
        expect(gpu.preventAutoStart).toBe(cpu.preventAutoStart);

        expect(gpu.noiseStrength.equals(cpu.noiseStrength)).toBe(true);

        gpu.dispose();
        cpu.dispose();
    });

    it("should respect capacity override in options", () => {
        const cpu = createSourceSystem();

        const gpuDefault = GPUParticleSystem.fromParticleSystem(cpu, scene);
        expect(gpuDefault.getCapacity()).toBe(cpu.getCapacity());
        gpuDefault.dispose();

        const gpuOverride = GPUParticleSystem.fromParticleSystem(cpu, scene, { capacity: 128 });
        expect(gpuOverride.getCapacity()).toBe(128);
        gpuOverride.dispose();

        cpu.dispose();
    });

    it("should default emitRateControl to true (opt-out via options)", () => {
        const cpu = createSourceSystem();

        const gpuDefault = GPUParticleSystem.fromParticleSystem(cpu, scene);
        expect(gpuDefault.emitRateControl).toBe(true);
        gpuDefault.dispose();

        const gpuOptOut = GPUParticleSystem.fromParticleSystem(cpu, scene, { emitRateControl: false });
        expect(gpuOptOut.emitRateControl).toBe(false);
        gpuOptOut.dispose();

        cpu.dispose();
    });

    it("should copy all supported gradients", () => {
        const cpu = createSourceSystem();
        const gpu = GPUParticleSystem.fromParticleSystem(cpu, scene);

        expect(gpu.getColorGradients()!.length).toBe(2);
        expect(gpu.getSizeGradients()!.length).toBe(2);
        expect(gpu.getAngularSpeedGradients()!.length).toBe(1);
        expect(gpu.getVelocityGradients()!.length).toBe(1);
        expect(gpu.getLimitVelocityGradients()!.length).toBe(1);
        expect(gpu.getDragGradients()!.length).toBe(1);
        expect(gpu.getEmitRateGradients()!.length).toBe(2);
        expect(gpu.getStartSizeGradients()!.length).toBe(1);
        expect(gpu.getLifeTimeGradients()!.length).toBe(1);

        // Spot-check values and factor2 preservation.
        const sizeGrads = gpu.getSizeGradients()!;
        expect(sizeGrads[0].gradient).toBe(0.0);
        expect(sizeGrads[0].factor1).toBe(1.0);
        expect(sizeGrads[0].factor2).toBe(2.0);

        const lifeGrads = gpu.getLifeTimeGradients()!;
        expect(lifeGrads[0].factor1).toBe(1.5);
        expect(lifeGrads[0].factor2).toBe(2.5);

        const emitGrads = gpu.getEmitRateGradients()!;
        expect(emitGrads[0].gradient).toBe(0.0);
        expect(emitGrads[0].factor1).toBe(100);
        expect(emitGrads[1].gradient).toBe(1.0);
        expect(emitGrads[1].factor1).toBe(10);

        gpu.dispose();
        cpu.dispose();
    });

    it("should preserve color2 on color gradients", () => {
        const cpu = new ParticleSystem("source", 100, scene);
        cpu.addColorGradient(0.0, new Color4(1, 0, 0, 1), new Color4(0, 1, 0, 1));
        cpu.addColorGradient(0.5, new Color4(0.25, 0.5, 0.75, 1)); // no color2 — should survive as undefined
        cpu.addColorGradient(1.0, new Color4(0, 0, 0, 0), new Color4(1, 1, 1, 0));

        const gpu = GPUParticleSystem.fromParticleSystem(cpu, scene);

        const grads = gpu.getColorGradients()!;
        expect(grads.length).toBe(3);

        // First gradient: color1 and color2 both present and independent clones.
        expect(grads[0].color1.equals(new Color4(1, 0, 0, 1))).toBe(true);
        expect(grads[0].color2).toBeDefined();
        expect(grads[0].color2!.equals(new Color4(0, 1, 0, 1))).toBe(true);
        expect(grads[0].color1).not.toBe(cpu.getColorGradients()![0].color1);
        expect(grads[0].color2).not.toBe(cpu.getColorGradients()![0].color2);

        // Middle gradient: no color2 on source → no color2 on destination.
        expect(grads[1].color2).toBeUndefined();

        // Last gradient: color2 preserved.
        expect(grads[2].color2!.equals(new Color4(1, 1, 1, 0))).toBe(true);

        gpu.dispose();
        cpu.dispose();
    });

    it("should copy attractors independently", () => {
        const cpu = createSourceSystem();
        const gpu = GPUParticleSystem.fromParticleSystem(cpu, scene);

        expect(gpu.attractors.length).toBe(1);
        expect(gpu.attractors[0].strength).toBe(12);
        expect(gpu.attractors[0].position.equals(new Vector3(4, 5, 6))).toBe(true);

        // Mutating the source attractor must not affect the GPU copy.
        cpu.attractors[0].position.x = 999;
        cpu.attractors[0].strength = 0;
        expect(gpu.attractors[0].position.x).toBe(4);
        expect(gpu.attractors[0].strength).toBe(12);

        gpu.dispose();
        cpu.dispose();
    });

    it("should share the particle texture and noise texture by reference", () => {
        const cpu = new ParticleSystem("source", 100, scene);
        // Use stub objects for textures (no ProceduralTexture setup required in unit tests);
        // verify that whatever reference the source has is passed through to the GPU system.
        const fakeTexture = { name: "fake-texture" };
        const fakeNoise = { name: "fake-noise" };
        (cpu as any).particleTexture = fakeTexture;
        (cpu as any)._noiseTexture = fakeNoise;

        const gpu = GPUParticleSystem.fromParticleSystem(cpu, scene);
        expect(gpu.particleTexture).toBe(fakeTexture);
        expect(gpu.noiseTexture).toBe(fakeNoise);

        // Clear the stub references before dispose so the systems do not try to call dispose() on them.
        (cpu as any).particleTexture = null;
        (cpu as any)._noiseTexture = null;
        (gpu as any).particleTexture = null;
        (gpu as any)._noiseTexture = null;

        gpu.dispose();
        cpu.dispose();
    });

    it("should produce an independent emitter type", () => {
        const cpu = createSourceSystem();
        const gpu = GPUParticleSystem.fromParticleSystem(cpu, scene);

        const sourceEmitter = cpu.particleEmitterType as SphereParticleEmitter;
        const gpuEmitter = gpu.particleEmitterType as SphereParticleEmitter;

        expect(gpuEmitter).not.toBe(sourceEmitter);
        expect(gpuEmitter.radius).toBe(sourceEmitter.radius);

        sourceEmitter.radius = 99;
        expect(gpuEmitter.radius).toBe(2);

        gpu.dispose();
        cpu.dispose();
    });

    it("should be fully independent after conversion", () => {
        const cpu = createSourceSystem();
        const gpu = GPUParticleSystem.fromParticleSystem(cpu, scene);

        // Mutating cloned values on the source must not affect the GPU copy.
        cpu.color1.r = 0.123;
        cpu.gravity.y = 0;
        cpu.worldOffset.x = -1;
        cpu.translationPivot.x = -1;
        cpu.noiseStrength.x = -1;

        expect(gpu.color1.r).toBe(1);
        expect(gpu.gravity.y).toBe(-9.81);
        expect(gpu.worldOffset.x).toBe(7);
        expect(gpu.translationPivot.x).toBe(0.5);
        expect(gpu.noiseStrength.x).toBe(3);

        gpu.dispose();
        cpu.dispose();
    });

    it("should warn and skip subEmitters", () => {
        const cpu = new ParticleSystem("source", 100, scene);
        const sub = new ParticleSystem("sub", 10, scene);
        cpu.subEmitters = [sub];

        const warnSpy = vi.spyOn(Logger, "Warn");
        const gpu = GPUParticleSystem.fromParticleSystem(cpu, scene);

        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("subEmitters"));

        warnSpy.mockRestore();
        cpu.subEmitters = [];
        gpu.dispose();
        sub.dispose();
        cpu.dispose();
    });

    it("should warn on custom startDirectionFunction / startPositionFunction", () => {
        const cpu = new ParticleSystem("source", 100, scene);
        cpu.startDirectionFunction = () => {};
        cpu.startPositionFunction = () => {};

        const warnSpy = vi.spyOn(Logger, "Warn");
        const gpu = GPUParticleSystem.fromParticleSystem(cpu, scene);

        const warnings = warnSpy.mock.calls.map((c) => c[0] as string).join("\n");
        expect(warnings).toContain("startDirectionFunction");
        expect(warnings).toContain("startPositionFunction");

        warnSpy.mockRestore();
        gpu.dispose();
        cpu.dispose();
    });

    it("should warn on ramp/remap gradients and not copy them", () => {
        const cpu = new ParticleSystem("source", 100, scene);
        cpu.useRampGradients = true;
        cpu.addRampGradient(0.0, new Color3(1, 0, 0));
        cpu.addColorRemapGradient(0.0, 0.0, 1.0);
        cpu.addAlphaRemapGradient(0.0, 0.0, 1.0);

        const warnSpy = vi.spyOn(Logger, "Warn");
        const gpu = GPUParticleSystem.fromParticleSystem(cpu, scene);

        const warnings = warnSpy.mock.calls.map((c) => c[0] as string).join("\n");
        expect(warnings).toContain("rampGradients");
        expect(warnings).toContain("colorRemapGradients");
        expect(warnings).toContain("alphaRemapGradients");

        // None of these gradients are stored on the GPU system.
        expect(gpu.getRampGradients()?.length ?? 0).toBe(0);
        expect(gpu.getColorRemapGradients()?.length ?? 0).toBe(0);
        expect(gpu.getAlphaRemapGradients()?.length ?? 0).toBe(0);

        warnSpy.mockRestore();
        gpu.dispose();
        cpu.dispose();
    });

    it("should convert a CPU FlowMap into a GPU texture with matching dimensions and strength", () => {
        const cpu = new ParticleSystem("source", 100, scene);
        const flowMap = new FlowMap(4, 2, new Uint8ClampedArray(4 * 2 * 4));
        cpu.flowMap = flowMap;
        cpu.flowMapStrength = 3.5;

        const gpu = GPUParticleSystem.fromParticleSystem(cpu, scene);

        expect(gpu.flowMap).not.toBeNull();
        const { width, height } = gpu.flowMap!.getSize();
        expect(width).toBe(4);
        expect(height).toBe(2);
        expect(gpu.flowMapStrength).toBe(3.5);

        gpu.dispose();
        cpu.dispose();
    });

    it("should leave GPU flowMap null when the source has no flow map", () => {
        const cpu = new ParticleSystem("source", 100, scene);
        const gpu = GPUParticleSystem.fromParticleSystem(cpu, scene);

        expect(gpu.flowMap).toBeNull();

        gpu.dispose();
        cpu.dispose();
    });

    it("should not throw when source uses only defaults", () => {
        const cpu = new ParticleSystem("source", 100, scene);
        const gpu = GPUParticleSystem.fromParticleSystem(cpu, scene);

        expect(gpu.getCapacity()).toBe(100);
        expect(gpu.name).toBe("source (GPU)");

        gpu.dispose();
        cpu.dispose();
    });
});
