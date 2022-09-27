import type { Nullable } from "../../types";
import { Constants } from "../constants";
import type { WebGPUEngine } from "../webgpuEngine";
import type { WebGPUBundleList } from "./webgpuBundleList";
import type { WebGPUHardwareTexture } from "./webgpuHardwareTexture";

/** @internal */
export class WebGPUSnapshotRendering {
    private _engine: WebGPUEngine;

    private _record = false;
    private _play = false;
    private _mainPassBundleList: WebGPUBundleList[] = [];
    private _modeSaved: number;
    private _bundleList: WebGPUBundleList;
    private _bundleListRenderTarget: WebGPUBundleList;

    private _enabled = false;
    private _mode: number;

    constructor(engine: WebGPUEngine, renderingMode: number, bundleList: WebGPUBundleList, bundleListRenderTarget: WebGPUBundleList) {
        this._engine = engine;
        this._mode = renderingMode;
        this._bundleList = bundleList;
        this._bundleListRenderTarget = bundleListRenderTarget;
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
        this._mainPassBundleList.length = 0;
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

    public endMainRenderPass(): void {
        if (this._record) {
            this._mainPassBundleList.push(this._bundleList.clone());
        }
    }

    public endRenderTargetPass(currentRenderPass: GPURenderPassEncoder, gpuWrapper: WebGPUHardwareTexture): boolean {
        if (this._play) {
            gpuWrapper._bundleLists?.[gpuWrapper._currentLayer]?.run(currentRenderPass);
            if (this._mode === Constants.SNAPSHOTRENDERING_FAST) {
                this._engine._reportDrawCall(gpuWrapper._bundleLists?.[gpuWrapper._currentLayer]?.numDrawCalls);
            }
        } else if (this._record) {
            if (!gpuWrapper._bundleLists) {
                gpuWrapper._bundleLists = [];
            }
            gpuWrapper._bundleLists[gpuWrapper._currentLayer] = this._bundleListRenderTarget.clone();
            gpuWrapper._bundleLists[gpuWrapper._currentLayer].run(currentRenderPass);
            this._bundleListRenderTarget.reset();
        } else {
            return false;
        }
        return true;
    }

    public endFrame(mainRenderPass: Nullable<GPURenderPassEncoder>): void {
        if (this._record) {
            this._mainPassBundleList.push(this._bundleList.clone());
            this._record = false;
            this._play = true;
            this._mode = this._modeSaved;
        }

        if (mainRenderPass !== null && this._play) {
            for (let i = 0; i < this._mainPassBundleList.length; ++i) {
                this._mainPassBundleList[i].run(mainRenderPass);
                if (this._mode === Constants.SNAPSHOTRENDERING_FAST) {
                    this._engine._reportDrawCall(this._mainPassBundleList[i].numDrawCalls);
                }
            }
        }
    }

    public reset(): void {
        this.enabled = false;
        this.enabled = true;
    }
}
