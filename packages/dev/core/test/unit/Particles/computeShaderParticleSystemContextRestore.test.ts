import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { type DataBuffer } from "core/Buffers/dataBuffer";
import { type StorageBuffer } from "core/Buffers/storageBuffer";
import { NullEngine } from "core/Engines/nullEngine";
import { WebGPUEngine } from "core/Engines/webgpuEngine.pure";
import { WebGPUDataBuffer } from "core/Meshes/WebGPU/webgpuDataBuffer";
import { ComputeShaderParticleSystem } from "core/Particles/computeShaderParticleSystem";
import { GPUParticleSystem } from "core/Particles/gpuParticleSystem";
import { Scene } from "core/scene";

/**
 * NullEngine cannot create WebGPU storage buffers. Give it what StorageBuffer and the WebGPU restore loop need: a
 * device id (uniqueId, which a WebGPU restoration changes), createStorageBuffer() / updateStorageBuffer(), and
 * compute shader support so GPUParticleSystem picks the real ComputeShaderParticleSystem. _storageBuffers and
 * _releaseBuffer() are the real AbstractEngine / ThinEngine ones.
 */
function MakeWebGPULike(engine: NullEngine) {
    const internals = engine as any;
    internals.uniqueId = 1;
    internals.updateStorageBuffer = vi.fn();
    const createStorageBuffer = vi.fn((size: number): DataBuffer => {
        const buffer = new WebGPUDataBuffer(undefined, size);
        buffer.engineId = internals.uniqueId;
        buffer.references = 1;
        return buffer;
    });
    internals.createStorageBuffer = createStorageBuffer;
    engine.getCaps().supportComputeShaders = true;

    return {
        createStorageBuffer,
        storageBuffers: (): StorageBuffer[] => internals._storageBuffers,
        // A device loss and restoration: the new device gets a new id, then WebGPUEngine rebuilds its buffers
        // (scene geometries, which rebuild the particle systems, then uniform and storage buffers).
        restore: () => {
            internals.uniqueId++;
            (WebGPUEngine.prototype as unknown as { _rebuildBuffers: () => void })._rebuildBuffers.call(engine);
        },
    };
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

    function CreateInitializedSystem(): GPUParticleSystem {
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

    it("keeps one storage buffer pair registered per particle system across restorations", () => {
        const ps = CreateInitializedSystem();
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
        const ps = CreateInitializedSystem();
        const other = CreateInitializedSystem();
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
});
