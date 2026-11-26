import { type Nullable } from "core/types";
import { Constants } from "../constants";
import { type WebGPUEngine } from "../webgpuEngine";
import { type WebGPUBundleList } from "./webgpuBundleList";
import { Logger } from "core/Misc/logger";

/**
 * A depth/stencil clear the rendering manager issued between two rendering groups of a recorded frame
 * @internal
 */
export interface IWebGPURecordedClear {
    depth: boolean;
    stencil: boolean;
    /** a render pass was open when the clear was issued */
    passWasOpen: boolean;
    /** the scissor rectangle (x, y, width, height) of a clear drawn in the open render pass; null for a clear that started a render pass */
    scissor: Nullable<number[]>;
}

/**
 * What a rendering of the rendering groups did to the render passes of a recorded frame
 * @internal
 */
export interface IWebGPURecordedClearSequence {
    clears: IWebGPURecordedClear[];
    /** a render pass was open once the groups were rendered */
    passWasOpenAtEnd: boolean;
}

/** @internal */
export class WebGPUSnapshotRendering {
    private _engine: WebGPUEngine;

    private _record = false;
    private _play = false;
    private _playBundleListIndex = 0;
    private _allBundleLists: WebGPUBundleList[] = [];
    // The clears the rendering manager issued between the rendering groups, for each rendering in the order of the recorded frame. Fast
    // snapshot rendering does not render the groups: it issues these clears again to go through the render passes the bundle lists come from.
    private _allClearSequences: IWebGPURecordedClearSequence[] = [];
    private _clearSequence: Nullable<IWebGPURecordedClearSequence> = null;
    // A rendering of the groups can start inside another one: an observer of a rendering group that renders an object renderer in
    // the open render pass. A fast snapshot frame calls no such observer, so what it did belongs to the rendering it was called in.
    private _clearSequenceDepth = 0;
    private _playClearSequenceIndex = 0;
    private _recordingInvalidated = false;
    private _skipNextRenderPass = false;
    private _modeSaved: number;
    private _bundleList: WebGPUBundleList;

    private _enabled = false;
    private _mode: number;

    constructor(engine: WebGPUEngine, renderingMode: number, bundleList: WebGPUBundleList) {
        this._engine = engine;
        this._mode = renderingMode;
        this._bundleList = bundleList;
    }

    public showDebugLogs = false;

    public get enabled(): boolean {
        return this._enabled;
    }

    public get play() {
        return this._play;
    }

    public get record() {
        return this._record;
    }

    public set enabled(activate: boolean) {
        this._log("enabled", `activate=${activate}, mode=${this._mode}`);

        this._discardRecording();
        this._recordingInvalidated = false;
        this._skipNextRenderPass = false;
        if (this._record) {
            // A recording pass is in flight: _mode is temporarily SNAPSHOTRENDERING_STANDARD and is normally
            // restored to _modeSaved at the next endFrame(). Restore it now so that flipping _record off
            // doesn't leave _mode stuck on STANDARD — otherwise the next "enabled = true" would save STANDARD
            // as the user-requested mode and the engine would permanently fall back to STANDARD (forum #63365).
            this._mode = this._modeSaved;
        }
        this._record = this._enabled = activate;
        this._play = false;
        if (activate) {
            this._modeSaved = this._mode;
            this._mode = Constants.SNAPSHOTRENDERING_STANDARD; // need to reset to standard for the recording pass to avoid some code being bypassed
        }
    }

    public get mode(): number {
        return this._mode;
    }

    public set mode(mode: number) {
        if (this._record) {
            this._modeSaved = mode;
        } else {
            this._mode = mode;
        }
    }

    /** @internal */
    public handleRenderPassRestart(): void {
        if (!this._record) {
            return;
        }

        if (this._bundleList.isEmpty) {
            this._skipNextRenderPass = true;
        } else {
            this._discardRecording();
            this._recordingInvalidated = true;
        }
    }

    /**
     * The frame being recorded misses draws: it is recorded again at the next frame
     */
    public invalidateRecording(): void {
        if (!this._record) {
            return;
        }

        this._discardRecording();
        this._recordingInvalidated = true;
    }

    /**
     * The rendering groups of a rendering are about to be rendered: the clears between its groups are recorded until the matching
     * endClearSequence(). A rendering started inside another one adds to the sequence of the enclosing rendering.
     */
    public beginClearSequence(): void {
        if (!this._record) {
            return;
        }
        if (this._clearSequenceDepth++ === 0) {
            this._clearSequence = { clears: [], passWasOpenAtEnd: false };
            this._allClearSequences.push(this._clearSequence);
        }
    }

    /**
     * The rendering groups are rendered
     * @param passIsOpen whether a render pass is open
     */
    public endClearSequence(passIsOpen: boolean): void {
        if (this._clearSequenceDepth === 0) {
            // nothing was begun: no recording, or the recording was discarded since
            return;
        }
        if (--this._clearSequenceDepth === 0 && this._clearSequence) {
            this._clearSequence.passWasOpenAtEnd = passIsOpen;
            this._clearSequence = null;
        }
    }

    /**
     * Gets the clears being recorded, if the rendering groups of a recorded frame are being rendered. Only the clears the rendering
     * manager issues between two groups go there: a clear of the application is the application's to issue in a fast snapshot frame.
     */
    public get recordedClears(): Nullable<IWebGPURecordedClear[]> {
        return this._clearSequence ? this._clearSequence.clears : null;
    }

    /**
     * Gets the clears recorded for the next rendering of the frame being played
     * @returns the clears, or null if there is none to issue
     */
    public nextClearSequence(): Nullable<IWebGPURecordedClearSequence> {
        if (!this._play || this._playClearSequenceIndex >= this._allClearSequences.length) {
            return null;
        }
        return this._allClearSequences[this._playClearSequenceIndex++];
    }

    public endRenderPass(currentRenderPass: GPURenderPassEncoder): boolean {
        if (!this._record && !this._play) {
            // Snapshot rendering mode is not enabled
            return false;
        }

        let bundleList: Nullable<WebGPUBundleList> = null;

        if (this._record) {
            bundleList = this._bundleList.clone();
            this._bundleList.reset();
            if (this._skipNextRenderPass) {
                this._skipNextRenderPass = false;
                this._log("endRenderPass", "bundleList omitted for a restarted empty pass");
            } else if (this._recordingInvalidated) {
                this._log("endRenderPass", "bundleList discarded from an invalidated recording");
            } else {
                this._allBundleLists.push(bundleList);
                this._log("endRenderPass", `bundleList recorded at position #${this._allBundleLists.length - 1}`);
            }
        } else {
            // We are playing the snapshot
            if (this._playBundleListIndex >= this._allBundleLists.length) {
                this._log(
                    "endRenderPass",
                    `empty or out-of-sync bundleList (_allBundleLists.length=${this._allBundleLists.length}, playBundleListIndex=${this._playBundleListIndex})`
                );
            } else {
                this._log("endRenderPass", `run bundleList #${this._playBundleListIndex}`);
                bundleList = this._allBundleLists[this._playBundleListIndex++];
            }
        }

        if (bundleList) {
            bundleList.run(currentRenderPass);

            if (this._mode === Constants.SNAPSHOTRENDERING_FAST) {
                this._engine._reportDrawCall(bundleList.numDrawCalls);
            }
        }

        return true;
    }

    public endFrame(): void {
        if (this._record) {
            if (this._recordingInvalidated) {
                this._recordingInvalidated = false;
                this._discardRecording();
                this._log("endFrame", "recording invalidated, recording the next frame");
            } else {
                // We stop recording and switch to replay mode for the next frames
                this._record = false;
                this._play = true;
                this._mode = this._modeSaved;
                this._log("endFrame", "bundles recorded, switching to play mode");
            }
        }

        this._playBundleListIndex = 0;
        this._playClearSequenceIndex = 0;
        this._clearSequence = null;
        this._clearSequenceDepth = 0;
    }

    private _discardRecording(): void {
        this._allBundleLists.length = 0;
        this._allClearSequences.length = 0;
        this._clearSequence = null;
        this._clearSequenceDepth = 0;
    }

    public reset(): void {
        this._log("reset", "called");
        this.enabled = false;
        this.enabled = true;
    }

    private _log(funcName: string, message: string) {
        if (this.showDebugLogs) {
            Logger.Log(`[Frame: ${this._engine.frameId}] WebGPUSnapshotRendering:${funcName} - ${message}`);
        }
    }
}
