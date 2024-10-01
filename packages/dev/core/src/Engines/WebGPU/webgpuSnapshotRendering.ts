import { Constants } from "../constants";
import type { WebGPUEngine } from "../webgpuEngine";
import type { WebGPUBundleList } from "./webgpuBundleList";

/** @internal */
export class WebGPUSnapshotRendering {
    private _engine: WebGPUEngine;

    private _record = false;
    private _play = false;
    private _playBundleListIndex = 0;
    private _allBundleLists: WebGPUBundleList[] = [];
    private _modeSaved: number;
    private _bundleList: WebGPUBundleList;

    private _enabled = false;
    private _mode: number;

    constructor(engine: WebGPUEngine, renderingMode: number, bundleList: WebGPUBundleList) {
        this._engine = engine;
        this._mode = renderingMode;
        this._bundleList = bundleList;
    }

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
        this._allBundleLists.length = 0;
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

    public endRenderPass(currentRenderPass: GPURenderPassEncoder): boolean {
        if (!this._record && !this._play) {
            // Snapshot rendering mode is not enabled
            return false;
        }

        let bundleList: WebGPUBundleList;

        if (this._record) {
            bundleList = this._bundleList.clone();
            this._allBundleLists.push(bundleList);
            this._bundleList.reset();
        } else {
            // We are playing the snapshot
            if (this._playBundleListIndex >= this._allBundleLists.length) {
                throw new Error(
                    `Invalid playBundleListIndex! Your snapshot is no longer valid for the current frame, you should recreate a new one. playBundleListIndex=${this._playBundleListIndex}, allBundleLists.length=${this._allBundleLists.length}}`
                );
            }
            bundleList = this._allBundleLists[this._playBundleListIndex++];
        }

        bundleList.run(currentRenderPass);

        if (this._mode === Constants.SNAPSHOTRENDERING_FAST) {
            this._engine._reportDrawCall(bundleList.numDrawCalls);
        }

        return true;
    }

    public endFrame(): void {
        if (this._record) {
            // We stop recording and switch to replay mode for the next frames
            this._record = false;
            this._play = true;
            this._mode = this._modeSaved;
        }

        this._playBundleListIndex = 0;
    }

    public reset(): void {
        if (this._record) {
            this._mode = this._modeSaved;
        }
        this.enabled = false;
        this.enabled = true;
    }
}
