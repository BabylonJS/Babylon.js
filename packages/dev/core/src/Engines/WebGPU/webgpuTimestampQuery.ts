/* eslint-disable babylonjs/available */
/* eslint-disable @typescript-eslint/naming-convention */
import type { WebGPUBufferManager } from "./webgpuBufferManager";
import * as WebGPUConstants from "./webgpuConstants";
import { PerfCounter } from "../../Misc/perfCounter";
import { WebGPUQuerySet } from "./webgpuQuerySet";
import type { WebGPUEngine } from "../webgpuEngine";
import type { WebGPUPerfCounter } from "./webgpuPerfCounter";
import { Logger } from "core/Misc/logger";

/** @internal */
export class WebGPUTimestampQuery {
    private _engine: WebGPUEngine;
    private _device: GPUDevice;
    private _bufferManager: WebGPUBufferManager;

    private _enabled = false;
    private _gpuFrameTimeCounter: PerfCounter = new PerfCounter();
    private _measureDuration: WebGPUDurationMeasure;
    private _measureDurationState = 0;

    public get gpuFrameTimeCounter() {
        return this._gpuFrameTimeCounter;
    }

    constructor(engine: WebGPUEngine, device: GPUDevice, bufferManager: WebGPUBufferManager) {
        this._engine = engine;
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
            try {
                this._measureDuration = new WebGPUDurationMeasure(this._engine, this._device, this._bufferManager, 2000, "QuerySet_TimestampQuery");
            } catch (e) {
                this._enabled = false;
                Logger.Error("Could not create a WebGPUDurationMeasure!\nError: " + e.message + "\nMake sure timestamp query is supported and enabled in your browser.");
                return;
            }
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

    public startPass(descriptor: GPURenderPassDescriptor | GPUComputePassDescriptor, index: number): void {
        if (this._enabled) {
            this._measureDuration.startPass(descriptor, index);
        } else {
            descriptor.timestampWrites = undefined;
        }
    }

    public endPass(index: number, gpuPerfCounter?: WebGPUPerfCounter): void {
        if (!this._enabled || !gpuPerfCounter) {
            return;
        }

        const currentFrameId = this._engine.frameId;

        this._measureDuration.stopPass(index).then((duration_) => {
            gpuPerfCounter._addDuration(currentFrameId, duration_ !== null && duration_ > 0 ? duration_ : 0);
        });
    }

    public dispose() {
        this._measureDuration?.dispose();
    }
}

/** @internal */
export class WebGPUDurationMeasure {
    private _querySet: WebGPUQuerySet;
    private _count: number;

    constructor(engine: WebGPUEngine, device: GPUDevice, bufferManager: WebGPUBufferManager, count = 2, querySetLabel?: string) {
        this._count = count;
        this._querySet = new WebGPUQuerySet(engine, count, WebGPUConstants.QueryType.Timestamp, device, bufferManager, true, querySetLabel);
    }

    public start(encoder: GPUCommandEncoder): void {
        encoder.writeTimestamp?.(this._querySet.querySet, 0);
    }

    public async stop(encoder: GPUCommandEncoder): Promise<number | null> {
        encoder.writeTimestamp?.(this._querySet.querySet, 1);

        return encoder.writeTimestamp ? this._querySet.readTwoValuesAndSubtract(0) : 0;
    }

    public startPass(descriptor: GPURenderPassDescriptor | GPUComputePassDescriptor, index: number): void {
        if (index + 3 > this._count) {
            throw new Error("WebGPUDurationMeasure: index out of range (" + index + ")");
        }

        descriptor.timestampWrites = {
            querySet: this._querySet.querySet,
            beginningOfPassWriteIndex: index + 2,
            endOfPassWriteIndex: index + 3,
        };
    }

    public async stopPass(index: number): Promise<number | null> {
        return this._querySet.readTwoValuesAndSubtract(index + 2);
    }

    public dispose() {
        this._querySet.dispose();
    }
}
