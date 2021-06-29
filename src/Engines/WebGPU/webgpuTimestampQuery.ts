import { WebGPUBufferManager } from './webgpuBufferManager';
import * as WebGPUConstants from './webgpuConstants';
import { PerfCounter } from "../../Misc/perfCounter";
import { WebGPUQuerySet } from "./webgpuQuerySet";

/** @hidden */
export class WebGPUTimestampQuery {
    private _device: GPUDevice;
    private _bufferManager: WebGPUBufferManager;

    private _enabled = false;
    private _gpuFrameTimeCounter: PerfCounter = new PerfCounter();
    private _measureDuration: WebGPUDurationMeasure;
    private _measureDurationState = 0;

    public get gpuFrameTimeCounter() {
        return this._gpuFrameTimeCounter;
    }

    constructor(device: GPUDevice, bufferManager: WebGPUBufferManager) {
        this._device = device;
        this._bufferManager = bufferManager;
    }

    public get enable(): boolean {
        return this._enabled;
    }

    public set enable(value: boolean) {
        if (this._enabled === value) {
            return;
        }

        this._enabled = value;
        this._measureDurationState = 0;
        if (value) {
            this._measureDuration = new WebGPUDurationMeasure(this._device, this._bufferManager);
        } else {
            this._measureDuration.dispose();
        }
    }

    public startFrame(commandEncoder: GPUCommandEncoder): void {
        if (this._enabled && this._measureDurationState === 0) {
            this._measureDuration.start(commandEncoder);
            this._measureDurationState = 1;
        }
    }

    public endFrame(commandEncoder: GPUCommandEncoder): void {
        if (this._measureDurationState === 1) {
            this._measureDurationState = 2;
            this._measureDuration.stop(commandEncoder).then((duration) => {
                if (duration !== null && duration >= 0) {
                    this._gpuFrameTimeCounter.fetchNewFrame();
                    this._gpuFrameTimeCounter.addCount(duration, true);
                }
                this._measureDurationState = 0;
            });
        }
    }
}

/** @hidden */
export class WebGPUDurationMeasure {

    private _querySet: WebGPUQuerySet;

    constructor(device: GPUDevice, bufferManager: WebGPUBufferManager) {
        this._querySet = new WebGPUQuerySet(2, WebGPUConstants.QueryType.Timestamp, device, bufferManager);
    }

    public start(encoder: GPUCommandEncoder): void {
        encoder.writeTimestamp(this._querySet.querySet, 0);
    }

    public async stop(encoder: GPUCommandEncoder): Promise<number | null> {
        encoder.writeTimestamp(this._querySet.querySet, 1);

        return this._querySet.readTwoValuesAndSubtract(0);
    }

    public dispose() {
        this._querySet.dispose();
    }
}
