import { describe, expect, it, vi } from "vitest";
import { WebGPUEngine } from "core/Engines/webgpuEngine.pure";
import { WebGPUDrawContext } from "core/Engines/WebGPU/webgpuDrawContext";
import { WebGPUMaterialContext } from "core/Engines/WebGPU/webgpuMaterialContext";
import { DrawWrapper } from "core/Materials/drawWrapper";
import { type Effect } from "core/Materials/effect";

/**
 * A draw recorded by a snapshot is encoded again from its commands (WebGPUEngine._replayRecordedDraw) only while its draw context
 * keeps what it was recorded with. Shader hot swapping draws with the previous effect while the new one compiles, then sets the new
 * effect on the sub mesh (StandardMaterial.isReadyForSubMesh): that resets the draw context, so a draw recorded with the previous
 * effect is not encoded again, and the next full draw records the new pipeline.
 */
describe("WebGPUEngine recorded draws and shader hot swapping", () => {
    it("does not encode again a draw recorded with the previous effect once the new effect is set", () => {
        const bufferManager = { createRawBuffer: () => ({}), setRawData: () => {}, releaseBuffer: () => true };
        const materialContext = new WebGPUMaterialContext();
        const drawWrapper = new DrawWrapper({
            createDrawContext: () => new WebGPUDrawContext(bufferManager as any, {} as any),
            createMaterialContext: () => materialContext,
        } as any);
        drawWrapper.setEffect({} as Effect);
        const drawContext = drawWrapper.drawContext as WebGPUDrawContext;

        // the engine while a snapshot records again: a recorded draw is encoded into the bundle list
        const encoder = { setPipeline: vi.fn(), setIndexBuffer: vi.fn(), setVertexBuffer: vi.fn(), setBindGroup: vi.fn(), drawIndexed: vi.fn(), draw: vi.fn() };
        const engine = {
            _snapshotRendering: { record: true },
            _currentRenderTarget: null,
            currentSampleCount: 1,
            _bundleList: { numDrawCalls: 0, getBundleEncoder: () => encoder },
            _cacheRenderPipeline: { colorFormats: [] },
            _getCurrentRenderPass: () => {},
            _applyRenderPassChanges: () => {},
            _flushRenderPassCommands: () => {},
            _reportDrawCall: () => {},
        };
        const replay = () => WebGPUEngine.prototype._replayRecordedDraw.call(engine as any, drawWrapper);

        // a full draw with the previous effect: its bind groups created and its commands recorded
        materialContext.isDirty = false;
        drawContext.resetIsDirty(materialContext.updateId);
        drawContext._recordedDraw = {
            renderTarget: null,
            sampleCount: 1,
            pipeline: {} as GPURenderPipeline,
            bindGroups: [],
            indexBuffer: null,
            indexFormat: "uint16",
            vertexBuffers: [],
            vertexOffsets: [],
            indirectBuffer: null,
            indexed: true,
            count: 36,
            instances: 1,
            start: 0,
        };
        expect(replay()).toBe(true);
        expect(encoder.drawIndexed).toHaveBeenCalledTimes(1);

        // the new effect compiled: the sub mesh gets it
        drawWrapper.setEffect({} as Effect);
        expect(drawContext._recordedDraw).toBeUndefined();
        expect(replay()).toBe(false);
        expect(encoder.drawIndexed).toHaveBeenCalledTimes(1);
    });
});

/**
 * The meshes and the shadow maps check and keep their draws only while a snapshot records with the recorded draws switched on
 * (engine._recordsDraws): with them off, a recording costs what it did before them.
 */
describe("WebGPUEngine._recordsDraws", () => {
    const recordsDraws = (record: boolean, cachedDraws: boolean) =>
        Object.getOwnPropertyDescriptor(WebGPUEngine.prototype, "_recordsDraws")!.get!.call({ _snapshotRendering: { record }, _snapshotCachedDraws: cachedDraws });

    it("is true only while a snapshot records with the recorded draws switched on", () => {
        expect(recordsDraws(true, true)).toBe(true);
        expect(recordsDraws(true, false)).toBe(false);
        expect(recordsDraws(false, true)).toBe(false);
        expect(recordsDraws(false, false)).toBe(false);
    });
});
