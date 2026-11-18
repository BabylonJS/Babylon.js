import { vi } from "vitest";

import { type DataBuffer } from "core/Buffers/dataBuffer";
import { type StorageBuffer } from "core/Buffers/storageBuffer";
import { type NullEngine } from "core/Engines/nullEngine";
import { WebGPUDrawContext } from "core/Engines/WebGPU/webgpuDrawContext";
import { type WebGPUBufferManager } from "core/Engines/WebGPU/webgpuBufferManager";
import { WebGPUEngine } from "core/Engines/webgpuEngine.pure";
import { WebGPUDataBuffer } from "core/Meshes/WebGPU/webgpuDataBuffer";

/** A GPU buffer created by the fake buffer manager, tagged with the device it belongs to */
export type FakeGPUBuffer = { deviceId: number; label?: string };

/**
 * NullEngine cannot create WebGPU resources. Give it what the WebGPU restore path needs:
 * - a device id (uniqueId, which a WebGPU restoration changes);
 * - createStorageBuffer() / updateStorageBuffer() for StorageBuffer;
 * - compute shader support, so GPUParticleSystem picks the real ComputeShaderParticleSystem;
 * - instancing (as WebGPU has), and real WebGPUDrawContexts created on a fake buffer manager that belongs to the
 *   current device, as WebGPUEngine.createDrawContext() does. The engine gets a new buffer manager on each restoration.
 *
 * _storageBuffers and _releaseBuffer() are the real AbstractEngine / ThinEngine ones.
 * @param engine The NullEngine to extend
 * @returns accessors for the test and restore(), which simulates a device loss and restoration
 */
export function MakeWebGPULike(engine: NullEngine) {
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
    engine.getCaps().instancedArrays = true;
    engine._features.supportSpriteInstancing = true;

    const createBufferManager = () => {
        const deviceId: number = internals.uniqueId;
        return {
            deviceId,
            createRawBuffer: vi.fn((_size: number, _usage: number, _mappedAtCreation?: boolean, label?: string): FakeGPUBuffer => ({ deviceId, label })),
            releaseBuffer: vi.fn(() => true),
            setRawData: vi.fn(),
        };
    };
    internals._bufferManager = createBufferManager();
    const dummyIndexBuffer = new WebGPUDataBuffer(undefined, 8);
    internals.createDrawContext = () => new WebGPUDrawContext(internals._bufferManager as WebGPUBufferManager, dummyIndexBuffer);

    return {
        createStorageBuffer,
        storageBuffers: (): StorageBuffer[] => internals._storageBuffers,
        deviceId: (): number => internals.uniqueId,
        // A device loss and restoration: the new device gets a new id and a new buffer manager, then WebGPUEngine
        // rebuilds its buffers (scene geometries, which rebuild the particle systems and sprite managers, then uniform and storage buffers).
        restore: () => {
            internals.uniqueId++;
            internals._bufferManager = createBufferManager();
            (WebGPUEngine.prototype as unknown as { _rebuildBuffers: () => void })._rebuildBuffers.call(engine);
        },
    };
}
