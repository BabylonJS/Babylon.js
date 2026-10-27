import { describe, it, expect, beforeEach, vi } from "vitest";
import { WebGPUEngine } from "core/Engines/webgpuEngine.pure";

/**
 * Asynchronous pipeline creation: what the engine does with a mesh draw that waits for its render pipeline (WebGPUEngine._omitDraw),
 * run on the few members it uses. Outside of a snapshot recording the mesh is marked; in a recording, the snapshot must never replay
 * a frame that shows a mesh in some passes only, and must be recorded again once the pipelines it misses are created.
 */
describe("WebGPUEngine asynchronous pipeline creation", () => {
    let engine: any;
    let owner: { _pipelinePendingFrameId: number; _pipelineDrawnFrameId: number };
    let bundleList: { numDrawCalls: number };
    let resolvePipeline: (pipeline: GPURenderPipeline) => void;

    const omit = (pipeline: GPURenderPipeline | null) => (WebGPUEngine.prototype as any)._omitDraw.call(engine, owner, pipeline, bundleList);

    beforeEach(() => {
        const pending = new Promise<GPURenderPipeline>((resolve) => (resolvePipeline = resolve));
        engine = {
            frameId: 10,
            _snapshotRendering: { record: true, invalidateRecording: vi.fn() },
            _cacheRenderPipeline: { lastPendingPipeline: pending },
            _snapshotPendingPipelines: new Set(),
            _pendingPipelinesGeneration: 0,
            _snapshotRecordAgain: false,
            _snapshotHeldBack: false,
        };
        owner = { _pipelinePendingFrameId: -2, _pipelineDrawnFrameId: -1 };
        bundleList = { numDrawCalls: 1 };
    });

    it("marks the mesh, and leaves the snapshot alone outside of a recording", () => {
        engine._snapshotRendering.record = false;
        omit(null);
        expect(owner._pipelinePendingFrameId).toBe(10);
        // the engine knows a draw waited in this frame: the per-mesh state is read until a frame without waits
        expect(engine._lastPipelineWaitFrameId).toBe(10);
        expect(bundleList.numDrawCalls).toBe(1);
        expect(engine._snapshotPendingPipelines.size).toBe(0);
    });

    it("records the snapshot again once the pipelines a coherent recording misses are created", async () => {
        omit(null);
        expect(bundleList.numDrawCalls).toBe(0);
        expect(engine._snapshotPendingPipelines.size).toBe(1);
        expect(engine._snapshotRendering.invalidateRecording).not.toHaveBeenCalled();

        resolvePipeline({} as GPURenderPipeline);
        await engine._cacheRenderPipeline.lastPendingPipeline;
        await Promise.resolve();
        expect(engine._snapshotRecordAgain).toBe(true);
        expect(engine._snapshotPendingPipelines.size).toBe(0);
    });

    it("records the next frame when an earlier pass of the frame drew the mesh", () => {
        owner._pipelineDrawnFrameId = 10;
        omit(null);
        expect(engine._snapshotRendering.invalidateRecording).toHaveBeenCalledTimes(1);
        expect(engine._snapshotPendingPipelines.size).toBe(0);
    });

    it("holds back a draw whose pipeline is ready, for the other passes of its mesh", () => {
        owner._pipelinePendingFrameId = 9;
        omit({} as GPURenderPipeline);
        expect(engine._snapshotHeldBack).toBe(true);
        expect(owner._pipelinePendingFrameId).toBe(9);
        expect(engine._snapshotRendering.invalidateRecording).not.toHaveBeenCalled();
    });

    it("ignores a creation that completes after the device was replaced", async () => {
        omit(null);
        engine._pendingPipelinesGeneration++;
        resolvePipeline({} as GPURenderPipeline);
        await engine._cacheRenderPipeline.lastPendingPipeline;
        await Promise.resolve();
        expect(engine._snapshotRecordAgain).toBe(false);
    });
});
