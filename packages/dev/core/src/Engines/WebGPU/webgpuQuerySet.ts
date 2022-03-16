import { WebGPUBufferManager } from './webgpuBufferManager';
import * as WebGPUConstants from './webgpuConstants';
import { QueryType } from "./webgpuConstants";

/** @hidden */
export class WebGPUQuerySet {

    private _device: GPUDevice;
    private _bufferManager: WebGPUBufferManager;

    private _count: number;
    private _canUseMultipleBuffers: boolean;
    private _querySet: GPUQuerySet;
    private _queryBuffer: GPUBuffer;
    private _dstBuffers: GPUBuffer[] = [];

    public get querySet(): GPUQuerySet {
        return this._querySet;
    }

    constructor(count: number, type: QueryType, device: GPUDevice, bufferManager: WebGPUBufferManager, canUseMultipleBuffers = true) {
        this._device = device;
        this._bufferManager = bufferManager;
        this._count = count;
        this._canUseMultipleBuffers = canUseMultipleBuffers;

        this._querySet = device.createQuerySet({
            type,
            count,
        });

        this._queryBuffer = bufferManager.createRawBuffer(8 * count, WebGPUConstants.BufferUsage.QueryResolve | WebGPUConstants.BufferUsage.CopySrc);

        if (!canUseMultipleBuffers) {
            this._dstBuffers.push(this._bufferManager.createRawBuffer(8 * this._count, WebGPUConstants.BufferUsage.MapRead | WebGPUConstants.BufferUsage.CopyDst));
        }
    }

    private _getBuffer(firstQuery: number, queryCount: number): GPUBuffer | null {
        if (!this._canUseMultipleBuffers && this._dstBuffers.length === 0) {
            return null;
        }

        const encoderResult = this._device.createCommandEncoder();

        let buffer: GPUBuffer;
        if (this._dstBuffers.length === 0) {
            buffer = this._bufferManager.createRawBuffer(8 * this._count, WebGPUConstants.BufferUsage.MapRead | WebGPUConstants.BufferUsage.CopyDst);
        } else {
            buffer = this._dstBuffers[this._dstBuffers.length - 1];
            this._dstBuffers.length--;
        }

        encoderResult.resolveQuerySet(this._querySet, firstQuery, queryCount, this._queryBuffer, 0);
        encoderResult.copyBufferToBuffer(this._queryBuffer, 0, buffer, 0, 8 * queryCount);

        this._device.queue.submit([encoderResult.finish()]);

        return buffer;
    }

    public async readValues(firstQuery = 0, queryCount = 1): Promise<BigUint64Array | null> {
        let buffer = this._getBuffer(firstQuery, queryCount);
        if (buffer === null) {
            return null;
        }

        await buffer.mapAsync(WebGPUConstants.MapMode.Read);

        const arrayBuf = new BigUint64Array(buffer.getMappedRange()).slice();

        buffer.unmap();

        this._dstBuffers[this._dstBuffers.length] = buffer;

        return arrayBuf;
    }

    public async readValue(firstQuery = 0): Promise<number | null> {
        let buffer = this._getBuffer(firstQuery, 1);
        if (buffer === null) {
            return null;
        }

        await buffer.mapAsync(WebGPUConstants.MapMode.Read);

        const arrayBuf = new BigUint64Array(buffer.getMappedRange());
        const value = Number(arrayBuf[0]);

        buffer.unmap();

        this._dstBuffers[this._dstBuffers.length] = buffer;

        return value;
    }

    public async readTwoValuesAndSubtract(firstQuery = 0): Promise<number | null> {
        let buffer = this._getBuffer(firstQuery, 2);
        if (buffer === null) {
            return null;
        }

        await buffer.mapAsync(WebGPUConstants.MapMode.Read);

        const arrayBuf = new BigUint64Array(buffer.getMappedRange());
        const value = Number(arrayBuf[1] - arrayBuf[0]);

        buffer.unmap();

        this._dstBuffers[this._dstBuffers.length] = buffer;

        return value;
    }

    public dispose() {
        this._querySet.destroy();
        this._bufferManager.releaseBuffer(this._queryBuffer);
        for (let i = 0; i < this._dstBuffers.length; ++i) {
            this._bufferManager.releaseBuffer(this._dstBuffers[i]);
        }
    }
}
