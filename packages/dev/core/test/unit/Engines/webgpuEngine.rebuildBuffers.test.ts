import { describe, expect, it, vi } from "vitest";

import { WebGPUEngine } from "core/Engines/webgpuEngine.pure";

const EngineId = 7;

// A scene stub with the two members WebGPUEngine._rebuildBuffers() uses. Its _rebuildGeometries() can also
// rebuild storage buffers, as Scene._rebuildGeometries() does for the ComputeShaderParticleSystem.
function CreateSceneStub(order: string[], name: string, rebuildsStorageBuffer?: { getBuffer: () => { engineId: number } }) {
    return {
        resetCachedMaterial: vi.fn(() => order.push(`${name}.resetCachedMaterial`)),
        _rebuildGeometries: vi.fn(() => {
            order.push(`${name}._rebuildGeometries`);
            if (rebuildsStorageBuffer) {
                rebuildsStorageBuffer.getBuffer().engineId = EngineId;
            }
        }),
    };
}

function CreateStorageBufferStub(order: string[], name: string) {
    const buffer = { engineId: EngineId - 1 };
    const storageBuffer = {
        getBuffer: () => buffer,
        _rebuild: vi.fn(() => {
            order.push(`${name}._rebuild`);
            buffer.engineId = EngineId;
        }),
    };
    return storageBuffer;
}

// Runs the real WebGPUEngine.prototype._rebuildBuffers (and the AbstractEngine one it calls) on a stub engine,
// as happens after a device loss, so no GPU is needed.
function RebuildBuffersAsWebGPUEngine(engine: object): void {
    (WebGPUEngine.prototype as unknown as { _rebuildBuffers: () => void })._rebuildBuffers.call(engine);
}

describe("WebGPUEngine._rebuildBuffers", () => {
    it("rebuilds the geometries of every scene and virtual scene, then the uniform and storage buffers", () => {
        const order: string[] = [];
        const rebuiltByGeometries = CreateStorageBufferStub(order, "particleStorageBuffer");
        const stale = CreateStorageBufferStub(order, "storageBuffer");
        const scene = CreateSceneStub(order, "scene", rebuiltByGeometries);
        const virtualScene = CreateSceneStub(order, "virtualScene");
        const uniformBuffer = { _rebuildAfterContextLost: vi.fn(() => order.push("uniformBuffer._rebuildAfterContextLost")) };

        RebuildBuffersAsWebGPUEngine({
            uniqueId: EngineId,
            scenes: [scene],
            _virtualScenes: [virtualScene],
            _uniformBuffers: [uniformBuffer],
            _storageBuffers: [rebuiltByGeometries, stale],
        });

        expect(scene._rebuildGeometries).toHaveBeenCalledOnce();
        expect(virtualScene._rebuildGeometries).toHaveBeenCalledOnce();
        // The storage buffer already rebuilt by _rebuildGeometries() is not rebuilt a second time.
        expect(rebuiltByGeometries._rebuild).not.toHaveBeenCalled();
        expect(order).toEqual([
            "scene.resetCachedMaterial",
            "scene._rebuildGeometries",
            "virtualScene.resetCachedMaterial",
            "virtualScene._rebuildGeometries",
            "uniformBuffer._rebuildAfterContextLost",
            "storageBuffer._rebuild",
        ]);
    });
});
