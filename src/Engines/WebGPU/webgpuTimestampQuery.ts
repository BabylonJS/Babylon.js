import { WebGPUBufferManager } from './webgpuBufferManager';
import * as WebGPUConstants from './webgpuConstants';
import { PerfCounter } from "../../Misc/perfCounter";

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
                if (duration >= 0) {
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

    private _device: GPUDevice;
    private _bufferManager: WebGPUBufferManager;

    private _querySet: GPUQuerySet;
    private _queryBuffer: GPUBuffer;
    private _dstBuffer: GPUBuffer;

    constructor(device: GPUDevice, bufferManager: WebGPUBufferManager) {
        this._device = device;
        this._bufferManager = bufferManager;

        this._querySet = device.createQuerySet({
            type: WebGPUConstants.QueryType.Timestamp,
            count: 2,
        });
        this._queryBuffer = bufferManager.createRawBuffer(8 * 2, WebGPUConstants.BufferUsage.QueryResolve | WebGPUConstants.BufferUsage.CopySrc);
        this._dstBuffer = bufferManager.createRawBuffer(8 * 2, WebGPUConstants.BufferUsage.MapRead | WebGPUConstants.BufferUsage.CopyDst);
    }

    public start(encoder: GPUCommandEncoder): void {
        encoder.writeTimestamp(this._querySet, 0);
    }

    public async stop(encoder: GPUCommandEncoder): Promise<number> {
        encoder.writeTimestamp(this._querySet, 1);

        const encoderResult = this._device.createCommandEncoder();

        encoderResult.resolveQuerySet(this._querySet, 0, 2, this._queryBuffer, 0);
        encoderResult.copyBufferToBuffer(this._queryBuffer, 0, this._dstBuffer, 0, 8 * 2);

        this._device.queue.submit([encoderResult.finish()]);

        await this._dstBuffer.mapAsync(WebGPUConstants.MapMode.Read);

        const arrayBuf = new BigUint64Array(this._dstBuffer.getMappedRange());
        const timeElapsedNanos = Number((arrayBuf[1] - arrayBuf[0]));

        this._dstBuffer.unmap();

        return timeElapsedNanos;
    }

    public dispose() {
        this._querySet.destroy();
        this._bufferManager.releaseBuffer(this._queryBuffer);
        this._bufferManager.releaseBuffer(this._dstBuffer);
    }
}
