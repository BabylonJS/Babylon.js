/* eslint-disable babylonjs/available */
import type { DataBuffer } from "../../Buffers/dataBuffer";
import { WebGPUDataBuffer } from "../../Meshes/WebGPU/webgpuDataBuffer";
import { FromHalfFloat } from "../../Misc/textureTools";
import type { Nullable } from "../../types";
import { Constants } from "../constants";
import { allocateAndCopyTypedBuffer } from "../Extensions/engine.readTexture";
import type { WebGPUEngine } from "../webgpuEngine";
// eslint-disable-next-line @typescript-eslint/naming-convention
import * as WebGPUConstants from "./webgpuConstants";

/** @internal */
export class WebGPUBufferManager {
    private _engine: WebGPUEngine;
    private _device: GPUDevice;
    private _deferredReleaseBuffers: Array<GPUBuffer> = [];

    private static _IsGPUBuffer(buffer: DataBuffer | GPUBuffer): buffer is GPUBuffer {
        return (buffer as DataBuffer).underlyingResource === undefined;
    }

    private static _FlagsToString(flags: GPUBufferUsageFlags, suffix = "") {
        let result = suffix;

        for (let i = 0; i <= 9; ++i) {
            if (flags & (1 << i)) {
                if (result) {
                    result += "_";
                }
                result += WebGPUConstants.BufferUsage[1 << i];
            }
        }

        return result;
    }

    constructor(engine: WebGPUEngine, device: GPUDevice) {
        this._engine = engine;
        this._device = device;
    }

    public createRawBuffer(viewOrSize: ArrayBufferView | number, flags: GPUBufferUsageFlags, mappedAtCreation = false, label?: string): GPUBuffer {
        const alignedLength = (viewOrSize as ArrayBufferView).byteLength !== undefined ? ((viewOrSize as ArrayBufferView).byteLength + 3) & ~3 : ((viewOrSize as number) + 3) & ~3; // 4 bytes alignments (because of the upload which requires this)
        const verticesBufferDescriptor = {
            label: "BabylonWebGPUDevice" + this._engine.uniqueId + "_" + WebGPUBufferManager._FlagsToString(flags, label ?? "Buffer") + "_size" + alignedLength,
            mappedAtCreation,
            size: alignedLength,
            usage: flags,
        };

        return this._device.createBuffer(verticesBufferDescriptor);
    }

    public createBuffer(viewOrSize: ArrayBufferView | number, flags: GPUBufferUsageFlags, label?: string): WebGPUDataBuffer {
        const isView = (viewOrSize as ArrayBufferView).byteLength !== undefined;
        const buffer = this.createRawBuffer(viewOrSize, flags, undefined, label);
        const dataBuffer = new WebGPUDataBuffer(buffer);
        dataBuffer.references = 1;
        dataBuffer.capacity = isView ? (viewOrSize as ArrayBufferView).byteLength : (viewOrSize as number);
        dataBuffer.engineId = this._engine.uniqueId;

        if (isView) {
            this.setSubData(dataBuffer, 0, viewOrSize as ArrayBufferView);
        }

        return dataBuffer;
    }

    public setRawData(buffer: GPUBuffer, dstByteOffset: number, src: ArrayBufferView, srcByteOffset: number, byteLength: number): void {
        this._device.queue.writeBuffer(buffer, dstByteOffset, src.buffer, srcByteOffset, byteLength);
    }

    public setSubData(dataBuffer: WebGPUDataBuffer, dstByteOffset: number, src: ArrayBufferView, srcByteOffset = 0, byteLength = 0): void {
        const buffer = dataBuffer.underlyingResource as GPUBuffer;

        byteLength = byteLength || src.byteLength;
        byteLength = Math.min(byteLength, dataBuffer.capacity - dstByteOffset);

        // After Migration to Canary
        let chunkStart = src.byteOffset + srcByteOffset;
        let chunkEnd = chunkStart + byteLength;

        // 4 bytes alignments for upload
        const alignedLength = (byteLength + 3) & ~3;
        if (alignedLength !== byteLength) {
            const tempView = new Uint8Array(src.buffer.slice(chunkStart, chunkEnd));
            src = new Uint8Array(alignedLength);
            (src as Uint8Array).set(tempView);
            srcByteOffset = 0;
            chunkStart = 0;
            chunkEnd = alignedLength;
            byteLength = alignedLength;
        }

        // Chunk
        const maxChunk = 1024 * 1024 * 15;
        let offset = 0;
        while (chunkEnd - (chunkStart + offset) > maxChunk) {
            this._device.queue.writeBuffer(buffer, dstByteOffset + offset, src.buffer, chunkStart + offset, maxChunk);
            offset += maxChunk;
        }

        this._device.queue.writeBuffer(buffer, dstByteOffset + offset, src.buffer, chunkStart + offset, byteLength - offset);
    }

    private _getHalfFloatAsFloatRGBAArrayBuffer(dataLength: number, arrayBuffer: ArrayBuffer, destArray?: Float32Array): Float32Array {
        if (!destArray) {
            destArray = new Float32Array(dataLength);
        }
        const srcData = new Uint16Array(arrayBuffer);
        while (dataLength--) {
            destArray[dataLength] = FromHalfFloat(srcData[dataLength]);
        }

        return destArray;
    }

    public readDataFromBuffer(
        gpuBuffer: GPUBuffer,
        size: number,
        width: number,
        height: number,
        bytesPerRow: number,
        bytesPerRowAligned: number,
        type = Constants.TEXTURETYPE_UNSIGNED_BYTE,
        offset = 0,
        buffer: Nullable<ArrayBufferView> = null,
        destroyBuffer = true,
        noDataConversion = false
    ): Promise<ArrayBufferView> {
        const floatFormat = type === Constants.TEXTURETYPE_FLOAT ? 2 : type === Constants.TEXTURETYPE_HALF_FLOAT ? 1 : 0;
        const engineId = this._engine.uniqueId;
        return new Promise((resolve, reject) => {
            gpuBuffer.mapAsync(WebGPUConstants.MapMode.Read, offset, size).then(
                () => {
                    const copyArrayBuffer = gpuBuffer.getMappedRange(offset, size);
                    let data: Nullable<ArrayBufferView> | Uint8Array | Float32Array = buffer;
                    if (noDataConversion) {
                        if (data === null) {
                            data = allocateAndCopyTypedBuffer(type, size, true, copyArrayBuffer);
                        } else {
                            data = allocateAndCopyTypedBuffer(type, data.buffer, undefined, copyArrayBuffer);
                        }
                    } else {
                        if (data === null) {
                            switch (floatFormat) {
                                case 0: // byte format
                                    data = new Uint8Array(size);
                                    (data as Uint8Array).set(new Uint8Array(copyArrayBuffer));
                                    break;
                                case 1: // half float
                                    // TODO WEBGPU use computer shaders (or render pass) to make the conversion?
                                    data = this._getHalfFloatAsFloatRGBAArrayBuffer(size / 2, copyArrayBuffer);
                                    break;
                                case 2: // float
                                    data = new Float32Array(size / 4);
                                    (data as Float32Array).set(new Float32Array(copyArrayBuffer));
                                    break;
                            }
                        } else {
                            switch (floatFormat) {
                                case 0: // byte format
                                    data = new Uint8Array(data.buffer);
                                    (data as Uint8Array).set(new Uint8Array(copyArrayBuffer));
                                    break;
                                case 1: // half float
                                    // TODO WEBGPU use computer shaders (or render pass) to make the conversion?
                                    data = this._getHalfFloatAsFloatRGBAArrayBuffer(size / 2, copyArrayBuffer, buffer as Float32Array);
                                    break;
                                case 2: // float
                                    data = new Float32Array(data.buffer);
                                    (data as Float32Array).set(new Float32Array(copyArrayBuffer));
                                    break;
                            }
                        }
                    }
                    if (bytesPerRow !== bytesPerRowAligned) {
                        // TODO WEBGPU use computer shaders (or render pass) to build the final buffer data?
                        if (floatFormat === 1 && !noDataConversion) {
                            // half float have been converted to float above
                            bytesPerRow *= 2;
                            bytesPerRowAligned *= 2;
                        }
                        const data2 = new Uint8Array(data!.buffer);
                        let offset = bytesPerRow,
                            offset2 = 0;
                        for (let y = 1; y < height; ++y) {
                            offset2 = y * bytesPerRowAligned;
                            for (let x = 0; x < bytesPerRow; ++x) {
                                data2[offset++] = data2[offset2++];
                            }
                        }
                        if (floatFormat !== 0 && !noDataConversion) {
                            data = new Float32Array(data2.buffer, 0, offset / 4);
                        } else {
                            data = new Uint8Array(data2.buffer, 0, offset);
                        }
                    }
                    gpuBuffer.unmap();
                    if (destroyBuffer) {
                        this.releaseBuffer(gpuBuffer);
                    }
                    resolve(data!);
                },
                (reason) => {
                    if (this._engine.isDisposed || this._engine.uniqueId !== engineId) {
                        // The engine was disposed while waiting for the promise, or a context loss/restoration has occurred: don't reject
                        resolve(new Uint8Array());
                    } else {
                        reject(reason);
                    }
                }
            );
        });
    }

    public releaseBuffer(buffer: DataBuffer | GPUBuffer): boolean {
        if (WebGPUBufferManager._IsGPUBuffer(buffer)) {
            this._deferredReleaseBuffers.push(buffer);
            return true;
        }

        buffer.references--;

        if (buffer.references === 0) {
            this._deferredReleaseBuffers.push(buffer.underlyingResource as GPUBuffer);
            return true;
        }

        return false;
    }

    public destroyDeferredBuffers(): void {
        for (let i = 0; i < this._deferredReleaseBuffers.length; ++i) {
            this._deferredReleaseBuffers[i].destroy();
        }

        this._deferredReleaseBuffers.length = 0;
    }
}
