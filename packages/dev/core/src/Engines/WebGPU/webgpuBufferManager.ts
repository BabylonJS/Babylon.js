/* eslint-disable babylonjs/available */
import type { DataBuffer } from "../../Buffers/dataBuffer";
import { WebGPUDataBuffer } from "../../Meshes/WebGPU/webgpuDataBuffer";
import { FromHalfFloat } from "../../Misc/textureTools";
import type { Nullable } from "../../types";
import { allocateAndCopyTypedBuffer } from "../abstractEngine.functions";
import { Constants } from "../constants";
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
        const dataBuffer = new WebGPUDataBuffer();
        const labelId = "DataBufferUniqueId=" + dataBuffer.uniqueId;
        dataBuffer.buffer = this.createRawBuffer(viewOrSize, flags, undefined, label ? labelId + "-" + label : labelId);
        dataBuffer.references = 1;
        // Next line should work, because the "size" property of GPUBuffer is required by the spec, but it seems that it fails in the CI / in playwright tests. So, we will recalculate the aligned size ourselves.
        //dataBuffer.capacity = dataBuffer.buffer.size;
        dataBuffer.capacity = (viewOrSize as ArrayBufferView).byteLength !== undefined ? ((viewOrSize as ArrayBufferView).byteLength + 3) & ~3 : ((viewOrSize as number) + 3) & ~3; // 4 bytes alignments (because of the upload which requires this)
        dataBuffer.engineId = this._engine.uniqueId;

        if (isView) {
            this.setSubData(dataBuffer, 0, viewOrSize as ArrayBufferView);
        }

        return dataBuffer;
    }

    // This calls GPUBuffer.writeBuffer() with no alignment corrections
    // dstByteOffset and byteLength must both be aligned to 4 bytes and bytes moved must be within src and dst arrays
    public setRawData(buffer: GPUBuffer, dstByteOffset: number, src: ArrayBufferView, srcByteOffset: number, byteLength: number): void {
        srcByteOffset += src.byteOffset;

        this._device.queue.writeBuffer(buffer, dstByteOffset, src.buffer, srcByteOffset, byteLength);
    }

    // This calls GPUBuffer.writeBuffer() with alignment corrections (dstByteOffset and byteLength will be aligned to 4 byte boundaries)
    // If alignment is needed, src must be a full copy of dataBuffer, or at least should be large enough to cope with the additional bytes copied because of alignment!
    public setSubData(dataBuffer: WebGPUDataBuffer, dstByteOffset: number, src: ArrayBufferView, srcByteOffset = 0, byteLength = 0): void {
        const buffer = dataBuffer.underlyingResource as GPUBuffer;

        byteLength = byteLength || src.byteLength - srcByteOffset;

        // Make sure the dst offset is aligned to 4 bytes
        const startPre = dstByteOffset & 3;

        srcByteOffset -= startPre;
        dstByteOffset -= startPre;

        // Make sure the byte length is aligned to 4 bytes
        const originalByteLength = byteLength;

        byteLength = (byteLength + startPre + 3) & ~3;

        // Check if the backing buffer of src is large enough to cope with the additional bytes copied because of alignment
        const backingBufferSize = src.buffer.byteLength - src.byteOffset;

        if (backingBufferSize < byteLength) {
            // Not enough place in the backing buffer for the aligned copy.
            // Creates a new buffer and copy the source data to it.
            // The buffer will have byteLength - originalByteLength zeros at the end.
            const tmpBuffer = new Uint8Array(byteLength);
            tmpBuffer.set(new Uint8Array(src.buffer, src.byteOffset + srcByteOffset, originalByteLength));
            src = tmpBuffer;
            srcByteOffset = 0;
        }

        this.setRawData(buffer, dstByteOffset, src, srcByteOffset, byteLength);
    }

    private _getHalfFloatAsFloatRGBAArrayBuffer(dataLength: number, arrayBuffer: ArrayBuffer, destArray?: Float32Array): Float32Array {
        if (!destArray) {
            destArray = new Float32Array(dataLength);
        } else {
            dataLength = Math.min(dataLength, destArray.length);
        }
        const srcData = new Uint16Array(arrayBuffer);
        while (dataLength--) {
            destArray[dataLength] = FromHalfFloat(srcData[dataLength]);
        }

        return destArray;
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/promise-function-async
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
            // eslint-disable-next-line github/no-then
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
                                    (data as Uint8Array).set(new Uint8Array(copyArrayBuffer, 0, Math.min(data.byteLength, size)));
                                    break;
                                case 1: // half float
                                    // TODO WEBGPU use computer shaders (or render pass) to make the conversion?
                                    data = this._getHalfFloatAsFloatRGBAArrayBuffer(size / 2, copyArrayBuffer, buffer as Float32Array);
                                    break;
                                case 2: // float
                                    data = new Float32Array(data.buffer);
                                    (data as Float32Array).set(new Float32Array(copyArrayBuffer, 0, data.byteLength / 4));
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
                        const data2 = new Uint8Array(data.buffer);
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
                    resolve(data);
                },
                (reason) => {
                    if (this._engine.isDisposed || this._engine.uniqueId !== engineId) {
                        // The engine was disposed while waiting for the promise, or a context loss/restoration has occurred: don't reject
                        resolve(new Uint8Array());
                    } else {
                        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
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
