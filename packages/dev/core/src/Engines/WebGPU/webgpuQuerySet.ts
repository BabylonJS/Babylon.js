/* eslint-disable babylonjs/available */
/* eslint-disable @typescript-eslint/naming-convention */
import type { WebGPUEngine } from "../webgpuEngine";
import type { WebGPUBufferManager } from "./webgpuBufferManager";
import * as WebGPUConstants from "./webgpuConstants";
import type { QueryType } from "./webgpuConstants";

/** @internal */
export class WebGPUQuerySet {
    private _engine: WebGPUEngine;
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

    constructor(engine: WebGPUEngine, count: number, type: QueryType, device: GPUDevice, bufferManager: WebGPUBufferManager, canUseMultipleBuffers = true, label?: string) {
        this._engine = engine;
        this._device = device;
        this._bufferManager = bufferManager;
        this._count = count;
        this._canUseMultipleBuffers = canUseMultipleBuffers;

        this._querySet = device.createQuerySet({
            label: label ?? "QuerySet",
            type,
            count,
        });

        this._queryBuffer = bufferManager.createRawBuffer(8 * count, WebGPUConstants.BufferUsage.QueryResolve | WebGPUConstants.BufferUsage.CopySrc, undefined, "QueryBuffer");

        if (!canUseMultipleBuffers) {
            this._dstBuffers.push(
                this._bufferManager.createRawBuffer(
                    8 * this._count,
                    WebGPUConstants.BufferUsage.MapRead | WebGPUConstants.BufferUsage.CopyDst,
                    undefined,
                    "QueryBufferNoMultipleBuffers"
                )
            );
        }
    }

    private _getBuffer(firstQuery: number, queryCount: number): GPUBuffer | null {
        if (!this._canUseMultipleBuffers && this._dstBuffers.length === 0) {
            return null;
        }

        const encoderResult = this._device.createCommandEncoder();

        let buffer: GPUBuffer;
        if (this._dstBuffers.length === 0) {
            buffer = this._bufferManager.createRawBuffer(
                8 * this._count,
                WebGPUConstants.BufferUsage.MapRead | WebGPUConstants.BufferUsage.CopyDst,
                undefined,
                "QueryBufferAdditionalBuffer"
            );
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
        const buffer = this._getBuffer(firstQuery, queryCount);
        if (buffer === null) {
            return null;
        }
        const engineId = this._engine.uniqueId;

        return buffer.mapAsync(WebGPUConstants.MapMode.Read).then(
            () => {
                const arrayBuf = new BigUint64Array(buffer.getMappedRange()).slice();

                buffer.unmap();

                this._dstBuffers[this._dstBuffers.length] = buffer;

                return arrayBuf;
            },
            (err) => {
                if (this._engine.isDisposed || this._engine.uniqueId !== engineId) {
                    // Engine disposed or context loss/restoration
                    return null;
                }
                throw err;
            }
        );
    }

    public async readValue(firstQuery = 0): Promise<number | null> {
        const buffer = this._getBuffer(firstQuery, 1);
        if (buffer === null) {
            return null;
        }
        const engineId = this._engine.uniqueId;

        return buffer.mapAsync(WebGPUConstants.MapMode.Read).then(
            () => {
                const arrayBuf = new BigUint64Array(buffer.getMappedRange());
                const value = Number(arrayBuf[0]);

                buffer.unmap();

                this._dstBuffers[this._dstBuffers.length] = buffer;

                return value;
            },
            (err) => {
                if (this._engine.isDisposed || this._engine.uniqueId !== engineId) {
                    // Engine disposed or context loss/restoration
                    return 0;
                }
                throw err;
            }
        );
    }

    public async readTwoValuesAndSubtract(firstQuery = 0): Promise<number | null> {
        const buffer = this._getBuffer(firstQuery, 2);
        if (buffer === null) {
            return null;
        }
        const engineId = this._engine.uniqueId;

        return buffer.mapAsync(WebGPUConstants.MapMode.Read).then(
            () => {
                const arrayBuf = new BigUint64Array(buffer.getMappedRange());
                const value = Number(arrayBuf[1] - arrayBuf[0]);

                buffer.unmap();

                this._dstBuffers[this._dstBuffers.length] = buffer;

                return value;
            },
            (err) => {
                if (this._engine.isDisposed || this._engine.uniqueId !== engineId) {
                    // Engine disposed or context loss/restoration
                    return 0;
                }
                throw err;
            }
        );
    }

    public dispose() {
        this._querySet.destroy();
        this._bufferManager.releaseBuffer(this._queryBuffer);
        for (let i = 0; i < this._dstBuffers.length; ++i) {
            this._bufferManager.releaseBuffer(this._dstBuffers[i]);
        }
    }
}
