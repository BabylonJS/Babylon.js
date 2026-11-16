import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { type IDrawContext } from "core/Engines/IDrawContext";
import { NullEngine } from "core/Engines/nullEngine";
import { WebGPUDrawContext } from "core/Engines/WebGPU/webgpuDrawContext";
import { type DrawWrapper } from "core/Materials/drawWrapper";
import { type WebGPUDataBuffer } from "core/Meshes/WebGPU/webgpuDataBuffer";
import { ComputeShaderParticleSystem } from "core/Particles/computeShaderParticleSystem";
import { GPUParticleSystem } from "core/Particles/gpuParticleSystem";
import { ParticleSystem } from "core/Particles/particleSystem";
import { Scene } from "core/scene";

import { type FakeGPUBuffer, MakeWebGPULike } from "../Engines/helpers/webgpuLikeNullEngine";

function CreateInitializedSystem(scene: Scene): GPUParticleSystem {
    const ps = new GPUParticleSystem("particles", { capacity: 100 }, scene);
    const platform = (ps as any)._platform;
    expect(platform).toBeInstanceOf(ComputeShaderParticleSystem);

    // rebuild() waits for the update compute shader, which needs a device. Treat it as ready so the system
    // recreates its particle buffers right away, as it does once the shader has compiled.
    vi.spyOn(ps, "_recreateUpdateEffect").mockReturnValue(true);
    vi.spyOn(platform, "isUpdateBufferReady").mockReturnValue(true);

    (ps as any)._initialize();
    return ps;
}

describe("ComputeShaderParticleSystem storage buffers across WebGPU restorations", () => {
    let engine: NullEngine;
    let scene: Scene;
    let webgpu: ReturnType<typeof MakeWebGPULike>;

    beforeEach(() => {
        engine = new NullEngine();
        webgpu = MakeWebGPULike(engine);
        scene = new Scene(engine);
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    it("keeps one storage buffer pair registered per particle system across restorations", () => {
        const ps = CreateInitializedSystem(scene);
        const initial = [...webgpu.storageBuffers()];
        const initialGpuBuffers = initial.map((buffer) => buffer.getBuffer());
        expect(initial).toHaveLength(2);
        expect(webgpu.createStorageBuffer).toHaveBeenCalledTimes(2);
        const releaseBuffer = vi.spyOn(engine, "_releaseBuffer");

        webgpu.restore();
        const afterFirst = [...webgpu.storageBuffers()];
        expect(afterFirst).toHaveLength(2);
        // The particle system replaced its pair, and the engine dropped the old one
        expect(afterFirst.some((buffer) => initial.includes(buffer))).toBe(false);
        // and the old pair's buffers were released
        for (const gpuBuffer of initialGpuBuffers) {
            expect(releaseBuffer).toHaveBeenCalledWith(gpuBuffer);
        }

        webgpu.restore();
        expect(webgpu.storageBuffers()).toHaveLength(2);
        expect(webgpu.storageBuffers().some((buffer) => afterFirst.includes(buffer))).toBe(false);

        // One new pair per restoration, and no GPU buffer for a dropped wrapper
        expect(webgpu.createStorageBuffer).toHaveBeenCalledTimes(6);
        for (const buffer of webgpu.storageBuffers()) {
            expect((buffer.getBuffer() as WebGPUDataBuffer).engineId).toBe((engine as any).uniqueId);
        }

        ps.dispose();
    });

    it("removes its storage buffers from the engine when the particle system is disposed after a restoration", () => {
        const ps = CreateInitializedSystem(scene);
        const other = CreateInitializedSystem(scene);
        expect(webgpu.storageBuffers()).toHaveLength(4);

        webgpu.restore();
        webgpu.restore();
        expect(webgpu.storageBuffers()).toHaveLength(4);

        ps.dispose();
        const remaining = webgpu.storageBuffers();
        expect(remaining).toHaveLength(2);
        expect(remaining.every((buffer) => (other as any)._platform._bufferComputeShader.includes(buffer))).toBe(true);

        other.dispose();
        expect(webgpu.storageBuffers()).toHaveLength(0);
    });

    it("does not recreate its buffers when it is disposed while a rebuild waits for the update effect", () => {
        vi.useFakeTimers();
        try {
            const ps = CreateInitializedSystem(scene);
            const initialize = vi.spyOn(ps as any, "_initialize");
            // The update compute shader of the new device is still compiling: rebuild() retries every 10 ms
            const recreateUpdateEffect = vi.spyOn(ps, "_recreateUpdateEffect").mockReturnValue(false);

            webgpu.restore();
            vi.advanceTimersByTime(25);
            expect(recreateUpdateEffect.mock.calls.length).toBeGreaterThan(1);
            expect(initialize).not.toHaveBeenCalled();
            expect(webgpu.storageBuffers()).toHaveLength(0);
            const storageBufferCount = webgpu.createStorageBuffer.mock.calls.length;
            const uniformBufferCount = (engine as any)._uniformBuffers.length;
            const updateEffectCount = recreateUpdateEffect.mock.calls.length;

            ps.dispose();

            // Compilation completes after the disposal
            recreateUpdateEffect.mockReturnValue(true);
            vi.advanceTimersByTime(100);

            // No more retries: no update effect (and its uniform buffer), no particle buffers, no storage pair
            expect(recreateUpdateEffect).toHaveBeenCalledTimes(updateEffectCount);
            expect(initialize).not.toHaveBeenCalled();
            expect(webgpu.createStorageBuffer).toHaveBeenCalledTimes(storageBufferCount);
            expect(webgpu.storageBuffers()).toHaveLength(0);
            expect((engine as any)._uniformBuffers).toHaveLength(uniformBufferCount);
            expect(vi.getTimerCount()).toBe(0);
        } finally {
            vi.useRealTimers();
        }
    });
});

describe("Particle system draw contexts across WebGPU restorations", () => {
    let engine: NullEngine;
    let scene: Scene;
    let webgpu: ReturnType<typeof MakeWebGPULike>;

    beforeEach(() => {
        engine = new NullEngine();
        webgpu = MakeWebGPULike(engine);
        scene = new Scene(engine);
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    // A draw context must belong to the current device: the buffer manager it creates its buffers with, and the
    // indirect draw buffer that an instanced draw passes to the device when compatibilityMode is false.
    function ExpectOnCurrentDevice(drawContext: IDrawContext | undefined, instanced: boolean) {
        const context = drawContext as WebGPUDrawContext;
        expect(context).toBeInstanceOf(WebGPUDrawContext);
        expect((context as any)._bufferManager.deviceId).toBe(webgpu.deviceId());
        expect(context.useInstancing).toBe(instanced);
        if (instanced) {
            expect((context.indirectDrawBuffer as unknown as FakeGPUBuffer).deviceId).toBe(webgpu.deviceId());
        }
    }

    it("recreates the draw contexts of a rendered GPU particle system on the new device", () => {
        const ps = CreateInitializedSystem(scene);
        // The draw wrapper of a system that has been rendered (render() gets it the same way)
        const wrapper = ps._getWrapper(ParticleSystem.BLENDMODE_ONEONE);
        const customWrapper = (ps as any)._customWrappers[0] as DrawWrapper;
        const effect = wrapper.effect;
        ExpectOnCurrentDevice(wrapper.drawContext, true);
        const oldContexts = [wrapper.drawContext, customWrapper.drawContext];
        const oldIndirectBuffer = wrapper.drawContext!.indirectDrawBuffer;
        const oldBufferManager = (wrapper.drawContext as any)._bufferManager;

        webgpu.restore();

        expect(wrapper.drawContext).not.toBe(oldContexts[0]);
        expect(customWrapper.drawContext).not.toBe(oldContexts[1]);
        ExpectOnCurrentDevice(wrapper.drawContext, true);
        ExpectOnCurrentDevice(customWrapper.drawContext, false);
        // The old context released its indirect draw buffer, and the next draw still uses the same wrapper and effect
        expect(oldBufferManager.releaseBuffer).toHaveBeenCalledWith(oldIndirectBuffer);
        expect(ps._getWrapper(ParticleSystem.BLENDMODE_ONEONE)).toBe(wrapper);
        expect(wrapper.effect).toBe(effect);

        webgpu.restore();
        ExpectOnCurrentDevice(wrapper.drawContext, true);
        ExpectOnCurrentDevice(customWrapper.drawContext, false);

        ps.dispose();
    });

    it("recreates the draw context of a CPU particle system custom effect on the new device", () => {
        const ps = new ParticleSystem("particles", 10, scene);
        ps.setCustomEffect(null, ParticleSystem.BLENDMODE_ADD);
        const customWrapper = ps._customWrappers[ParticleSystem.BLENDMODE_ADD]!;
        const oldContext = customWrapper.drawContext;
        ExpectOnCurrentDevice(oldContext, true);

        webgpu.restore();

        expect(customWrapper.drawContext).not.toBe(oldContext);
        ExpectOnCurrentDevice(customWrapper.drawContext, true);

        ps.dispose();
    });
});
