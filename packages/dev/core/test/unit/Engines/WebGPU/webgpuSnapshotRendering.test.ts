import { describe, it, expect, beforeEach, vi } from "vitest";
import { Constants } from "core/Engines/constants";
import { WebGPUSnapshotRendering } from "core/Engines/WebGPU/webgpuSnapshotRendering";
import { type WebGPUEngine } from "core/Engines/webgpuEngine";
import { WebGPUBundleList } from "core/Engines/WebGPU/webgpuBundleList";

describe("WebGPUSnapshotRendering", () => {
    let snapshot: WebGPUSnapshotRendering;

    beforeEach(() => {
        const engine = { frameId: 0 } as unknown as WebGPUEngine;
        const bundleList = {} as unknown as WebGPUBundleList;
        snapshot = new WebGPUSnapshotRendering(engine, Constants.SNAPSHOTRENDERING_FAST, bundleList);
    });

    it("completes a normal record/play cycle in the requested mode", () => {
        snapshot.enabled = true;
        // Recording pass uses STANDARD mode internally.
        expect(snapshot.record).toBe(true);
        expect(snapshot.mode).toBe(Constants.SNAPSHOTRENDERING_STANDARD);

        snapshot.endFrame();
        // After endFrame, mode is restored to the user-requested value and we are in playback.
        expect(snapshot.record).toBe(false);
        expect(snapshot.play).toBe(true);
        expect(snapshot.mode).toBe(Constants.SNAPSHOTRENDERING_FAST);
    });

    it("preserves the requested mode when disable interrupts an in-progress recording", () => {
        // Start a recording pass (regression for forum #63365).
        snapshot.enabled = true;
        expect(snapshot.record).toBe(true);
        expect(snapshot.mode).toBe(Constants.SNAPSHOTRENDERING_STANDARD);

        // Disable while still recording — without the fix, _mode is stuck at STANDARD.
        snapshot.enabled = false;
        expect(snapshot.record).toBe(false);
        expect(snapshot.enabled).toBe(false);
        expect(snapshot.mode).toBe(Constants.SNAPSHOTRENDERING_FAST);

        // Re-enable and complete the cycle. Mode must end at FAST, not STANDARD.
        snapshot.enabled = true;
        snapshot.endFrame();
        expect(snapshot.mode).toBe(Constants.SNAPSHOTRENDERING_FAST);
    });

    it("preserves the requested mode across a reset() that interrupts recording", () => {
        snapshot.enabled = true;
        expect(snapshot.record).toBe(true);
        expect(snapshot.mode).toBe(Constants.SNAPSHOTRENDERING_STANDARD);

        snapshot.reset();
        // reset() = enabled=false; enabled=true; we should be recording again, in the original mode.
        expect(snapshot.record).toBe(true);
        snapshot.endFrame();
        expect(snapshot.mode).toBe(Constants.SNAPSHOTRENDERING_FAST);
    });

    it("keeps bundle replay aligned after an empty recording pass is restarted", () => {
        const engine = { frameId: 0, _reportDrawCall: vi.fn() } as unknown as WebGPUEngine;
        const bundleList = new WebGPUBundleList({} as GPUDevice);
        const drawBundle = {} as GPURenderBundle;
        const restartedPass = {
            executeBundles: vi.fn(),
        } as unknown as GPURenderPassEncoder;
        const recordedPass = {
            executeBundles: vi.fn(),
        } as unknown as GPURenderPassEncoder;
        const playbackPass = {
            executeBundles: vi.fn(),
        } as unknown as GPURenderPassEncoder;
        snapshot = new WebGPUSnapshotRendering(engine, Constants.SNAPSHOTRENDERING_FAST, bundleList);

        snapshot.enabled = true;
        snapshot.handleRenderPassRestart();
        snapshot.endRenderPass(restartedPass);
        bundleList.addBundle(drawBundle);
        snapshot.endRenderPass(recordedPass);
        snapshot.endFrame();

        expect(snapshot.play).toBe(true);
        expect(recordedPass.executeBundles).toHaveBeenCalledExactlyOnceWith([drawBundle]);

        snapshot.endRenderPass(playbackPass);
        snapshot.endFrame();

        expect(playbackPass.executeBundles).toHaveBeenCalledExactlyOnceWith([drawBundle]);
    });

    it("records the next frame again when a recording misses draws", () => {
        snapshot.enabled = true;
        snapshot.invalidateRecording();
        snapshot.endFrame();
        expect(snapshot.record).toBe(true);

        snapshot.endFrame();
        expect(snapshot.play).toBe(true);
        expect(snapshot.mode).toBe(Constants.SNAPSHOTRENDERING_FAST);

        // not recording: nothing to invalidate
        snapshot.invalidateRecording();
        snapshot.endFrame();
        expect(snapshot.play).toBe(true);
    });

    it("keeps the clears of each rendering of the rendering groups, in the order of the recorded frame", () => {
        const clear = { depth: true, stencil: false, passWasOpen: true, scissor: null };

        // nothing is recorded outside of a recording, or outside of a rendering of the groups
        expect(snapshot.recordedClears).toBeNull();
        snapshot.beginClearSequence();
        expect(snapshot.recordedClears).toBeNull();

        snapshot.enabled = true;
        expect(snapshot.recordedClears).toBeNull();
        snapshot.beginClearSequence();
        snapshot.endClearSequence(false);
        snapshot.beginClearSequence();
        snapshot.recordedClears!.push(clear);
        snapshot.endClearSequence(true);
        expect(snapshot.recordedClears).toBeNull();
        // the clears are issued again once the snapshot is played
        expect(snapshot.nextClearSequence()).toBeNull();
        snapshot.endFrame();

        for (let frame = 0; frame < 2; frame++) {
            expect(snapshot.nextClearSequence()).toEqual({ clears: [], passWasOpenAtEnd: false });
            expect(snapshot.nextClearSequence()).toEqual({ clears: [clear], passWasOpenAtEnd: true });
            expect(snapshot.nextClearSequence()).toBeNull();
            snapshot.endFrame();
        }
    });

    it("keeps what a rendering started inside another one does in the sequence of the enclosing rendering", () => {
        const first = { depth: true, stencil: true, passWasOpen: true, scissor: null };
        const second = { depth: true, stencil: false, passWasOpen: true, scissor: null };

        snapshot.enabled = true;
        snapshot.beginClearSequence();
        snapshot.recordedClears!.push(first);
        // an observer of a rendering group renders an object renderer in the open render pass
        snapshot.beginClearSequence();
        snapshot.endClearSequence(true);
        // the enclosing rendering goes on: its clears are still recorded, in its own sequence
        snapshot.recordedClears!.push(second);
        snapshot.endClearSequence(false);
        expect(snapshot.recordedClears).toBeNull();
        snapshot.endFrame();

        // a fast snapshot frame calls no such observer: there is one sequence to play, for the enclosing rendering
        expect(snapshot.nextClearSequence()).toEqual({ clears: [first, second], passWasOpenAtEnd: false });
        expect(snapshot.nextClearSequence()).toBeNull();
    });

    it("discards the recorded clears with the bundle lists of an invalidated recording", () => {
        snapshot.enabled = true;
        snapshot.beginClearSequence();
        snapshot.invalidateRecording();
        expect(snapshot.recordedClears).toBeNull();
        snapshot.endClearSequence(true);
        snapshot.beginClearSequence();
        snapshot.endClearSequence(true);
        snapshot.endFrame();
        expect(snapshot.record).toBe(true);

        // the next frame is the one recorded
        snapshot.beginClearSequence();
        snapshot.endClearSequence(false);
        snapshot.endFrame();
        expect(snapshot.nextClearSequence()).toEqual({ clears: [], passWasOpenAtEnd: false });
        expect(snapshot.nextClearSequence()).toBeNull();

        snapshot.reset();
        snapshot.endFrame();
        expect(snapshot.nextClearSequence()).toBeNull();
    });
});
