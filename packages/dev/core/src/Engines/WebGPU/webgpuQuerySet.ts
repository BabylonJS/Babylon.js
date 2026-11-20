/* eslint-disable babylonjs/available */
/* eslint-disable @typescript-eslint/naming-convention */
import { type WebGPUEngine } from "../webgpuEngine";
import { type WebGPUBufferManager } from "./webgpuBufferManager";
import * as WebGPUConstants from "./webgpuConstants";
import { type QueryType } from "./webgpuConstants";

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

    private _getBuffer(firstQuery: number, queryCount: number, encoder?: GPUCommandEncoder): GPUBuffer | null {
        if (!this._canUseMultipleBuffers && this._dstBuffers.length === 0) {
            return null;
        }

        const encoderResult = encoder ?? this._device.createCommandEncoder();

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

        if (!encoder) {
            this._device.queue.submit([encoderResult.finish()]);
        }

        return buffer;
    }

    public async readValues(firstQuery = 0, queryCount = 1, encoder?: GPUCommandEncoder): Promise<BigUint64Array | null> {
        const buffer = this._getBuffer(firstQuery, queryCount, encoder);
        if (buffer === null) {
            return null;
        }
        const engineId = this._engine.uniqueId;

        try {
            if (encoder) {
                // resolved in that encoder after its queries: mapped once the engine submits it, a wait its readbacks share
                await this._engine._whenSubmittedAsync();
            }
            await buffer.mapAsync(WebGPUConstants.MapMode.Read);
            const arrayBuf = new BigUint64Array(buffer.getMappedRange()).slice();

            buffer.unmap();

            this._dstBuffers[this._dstBuffers.length] = buffer;

            return arrayBuf;
        } catch (err) {
            if (this._readbackWasAborted(err, engineId)) {
                // Engine disposed or context loss/restoration
                return null;
            }
            throw err;
        }
    }

    public async readValue(firstQuery = 0, encoder?: GPUCommandEncoder): Promise<number | null> {
        const buffer = this._getBuffer(firstQuery, 1, encoder);
        if (buffer === null) {
            return null;
        }
        const engineId = this._engine.uniqueId;

        try {
            if (encoder) {
                // resolved in that encoder after its queries: mapped once the engine submits it, a wait its readbacks share
                await this._engine._whenSubmittedAsync();
            }
            await buffer.mapAsync(WebGPUConstants.MapMode.Read);
            const arrayBuf = new BigUint64Array(buffer.getMappedRange());
            const value = Number(arrayBuf[0]);

            buffer.unmap();

            this._dstBuffers[this._dstBuffers.length] = buffer;

            return value;
        } catch (err) {
            if (this._readbackWasAborted(err, engineId)) {
                // Engine disposed or context loss/restoration: no sample, so that a cancelled readback is not recorded as a 0 ns duration
                return null;
            }
            throw err;
        }
    }

    public async readTwoValuesAndSubtract(firstQuery = 0, encoder?: GPUCommandEncoder): Promise<number | null> {
        const buffer = this._getBuffer(firstQuery, 2, encoder);
        if (buffer === null) {
            return null;
        }
        const engineId = this._engine.uniqueId;

        try {
            if (encoder) {
                // resolved in that encoder after its queries: mapped once the engine submits it, a wait its readbacks share
                await this._engine._whenSubmittedAsync();
            }
            await buffer.mapAsync(WebGPUConstants.MapMode.Read);
            const arrayBuf = new BigUint64Array(buffer.getMappedRange());
            const value = Number(arrayBuf[1] - arrayBuf[0]);

            buffer.unmap();

            this._dstBuffers[this._dstBuffers.length] = buffer;

            return value;
        } catch (err) {
            if (this._readbackWasAborted(err, engineId)) {
                // Engine disposed or context loss/restoration: no sample, so that a cancelled readback is not recorded as a 0 ns duration
                return null;
            }
            throw err;
        }
    }

    // The device can be lost before the engine is restored with a new uniqueId: the pending mapAsync then rejects right away with an
    // AbortError (the buffer was unmapped or destroyed before the mapping resolved), while the engine still has the old uniqueId
    private _readbackWasAborted(err: unknown, engineId: number): boolean {
        return this._engine.isDisposed || this._engine.uniqueId !== engineId || (err as { name?: unknown } | null)?.name === "AbortError";
    }

    public dispose() {
        this._querySet.destroy();
        this._bufferManager.releaseBuffer(this._queryBuffer);
        for (let i = 0; i < this._dstBuffers.length; ++i) {
            this._bufferManager.releaseBuffer(this._dstBuffers[i]);
        }
    }
}
