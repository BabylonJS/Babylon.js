import { describe, expect, it, vi } from "vitest";

import { WebGPUEngine } from "core/Engines/webgpuEngine.pure";

const EngineId = 7;

// A scene stub with the two members WebGPUEngine._rebuildBuffers() uses.
function CreateSceneStub(order: string[], name: string) {
    return {
        resetCachedMaterial: vi.fn(() => order.push(`${name}.resetCachedMaterial`)),
        _rebuildGeometries: vi.fn(() => order.push(`${name}._rebuildGeometries`)),
    };
}

// A storage buffer whose GPU buffer was created by the device with id `engineId`.
function CreateStorageBufferStub(order: string[], name: string, engineId: number) {
    const buffer = { engineId };
    return {
        getBuffer: () => buffer,
        _rebuild: vi.fn(() => {
            order.push(`${name}._rebuild`);
            buffer.engineId = EngineId;
        }),
    };
}

// Runs the real WebGPUEngine.prototype._rebuildBuffers (and the AbstractEngine one it calls) on a stub engine,
// as happens after a device loss, so no GPU is needed.
function RebuildBuffersAsWebGPUEngine(engine: object): void {
    (WebGPUEngine.prototype as unknown as { _rebuildBuffers: () => void })._rebuildBuffers.call(engine);
}

// The particle systems' storage buffers, which _rebuildGeometries() replaces, are covered with a real
// ComputeShaderParticleSystem in Particles/computeShaderParticleSystemContextRestore.test.ts.
describe("WebGPUEngine._rebuildBuffers", () => {
    it("rebuilds the geometries of every scene and virtual scene, then the uniform and storage buffers", () => {
        const order: string[] = [];
        const stale = CreateStorageBufferStub(order, "staleStorageBuffer", EngineId - 1);
        const current = CreateStorageBufferStub(order, "currentStorageBuffer", EngineId);
        const scene = CreateSceneStub(order, "scene");
        const virtualScene = CreateSceneStub(order, "virtualScene");
        const uniformBuffer = { _rebuildAfterContextLost: vi.fn(() => order.push("uniformBuffer._rebuildAfterContextLost")) };

        RebuildBuffersAsWebGPUEngine({
            uniqueId: EngineId,
            scenes: [scene],
            _virtualScenes: [virtualScene],
            _uniformBuffers: [uniformBuffer],
            _storageBuffers: [stale, current],
        });

        expect(scene._rebuildGeometries).toHaveBeenCalledOnce();
        expect(virtualScene._rebuildGeometries).toHaveBeenCalledOnce();
        // A storage buffer already created on the new device is not rebuilt
        expect(current._rebuild).not.toHaveBeenCalled();
        expect(order).toEqual([
            "scene.resetCachedMaterial",
            "scene._rebuildGeometries",
            "virtualScene.resetCachedMaterial",
            "virtualScene._rebuildGeometries",
            "uniformBuffer._rebuildAfterContextLost",
            "staleStorageBuffer._rebuild",
        ]);
    });
});
