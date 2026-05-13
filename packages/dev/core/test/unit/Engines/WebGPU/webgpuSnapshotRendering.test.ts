import { describe, it, expect, beforeEach } from "vitest";
import { Constants } from "core/Engines/constants";
import { WebGPUSnapshotRendering } from "core/Engines/WebGPU/webgpuSnapshotRendering";
import { type WebGPUEngine } from "core/Engines/webgpuEngine";
import { type WebGPUBundleList } from "core/Engines/WebGPU/webgpuBundleList";

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
});
