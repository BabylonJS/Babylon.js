import { DataBuffer } from '../../Buffers/dataBuffer';
import { WebGPUDataBuffer } from '../../Meshes/WebGPU/webgpuDataBuffer';
import { Nullable } from '../../types';
import * as WebGPUConstants from './webgpuConstants';

/** @hidden */
export class WebGPUBufferManager {

    private _device: GPUDevice;
    private _deferredReleaseBuffers: Array<GPUBuffer> = [];

    private static _IsGPUBuffer(buffer: DataBuffer | GPUBuffer): buffer is GPUBuffer {
        return (buffer as DataBuffer).underlyingResource === undefined;
    }

    constructor(device: GPUDevice) {
        this._device = device;
    }

    public createRawBuffer(viewOrSize: ArrayBufferView | number, flags: GPUBufferUsageFlags, mappedAtCreation = false): GPUBuffer {
        const alignedLength = (viewOrSize as ArrayBufferView).byteLength !== undefined ? ((viewOrSize as ArrayBufferView).byteLength + 3) & ~3 : ((viewOrSize as number) + 3) & ~3; // 4 bytes alignments (because of the upload which requires this)
        const verticesBufferDescriptor = {
            mappedAtCreation,
            size: alignedLength,
            usage: flags
        };

        return this._device.createBuffer(verticesBufferDescriptor);
    }

    public createBuffer(viewOrSize: ArrayBufferView | number, flags: GPUBufferUsageFlags): DataBuffer {
        const isView = (viewOrSize as ArrayBufferView).byteLength !== undefined;
        const buffer = this.createRawBuffer(viewOrSize, flags);
        const dataBuffer = new WebGPUDataBuffer(buffer);
        dataBuffer.references = 1;
        dataBuffer.capacity = isView ? (viewOrSize as ArrayBufferView).byteLength : viewOrSize as number;

        if (isView) {
            this.setSubData(dataBuffer, 0, viewOrSize as ArrayBufferView);
        }

        return dataBuffer;
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
        while ((chunkEnd - (chunkStart + offset)) > maxChunk) {
            this._device.queue.writeBuffer(buffer, dstByteOffset + offset, src.buffer, chunkStart + offset, maxChunk);
            offset += maxChunk;
        }

        this._device.queue.writeBuffer(buffer, dstByteOffset + offset, src.buffer, chunkStart + offset, byteLength - offset);
    }

    private _FromHalfFloat(value: number): number {
        const s = (value & 0x8000) >> 15;
        const e = (value & 0x7C00) >> 10;
        const f = value & 0x03FF;

        if (e === 0) {
            return (s ? -1 : 1) * Math.pow(2, -14) * (f / Math.pow(2, 10));
        } else if (e == 0x1F) {
            return f ? NaN : ((s ? -1 : 1) * Infinity);
        }

        return (s ? -1 : 1) * Math.pow(2, e - 15) * (1 + (f / Math.pow(2, 10)));
    }

    private _GetHalfFloatAsFloatRGBAArrayBuffer(dataLength: number, arrayBuffer: ArrayBuffer, destArray?: Float32Array): Float32Array {
        if (!destArray) {
            destArray = new Float32Array(dataLength);
        }
        const srcData = new Uint16Array(arrayBuffer);
        while (dataLength--) {
            destArray[dataLength] = this._FromHalfFloat(srcData[dataLength]);
        }

        return destArray;
    }

    public readDataFromBuffer(gpuBuffer: GPUBuffer, size: number, width: number, height: number, bytesPerRow: number, bytesPerRowAligned: number, floatFormat = 0, offset = 0, buffer: Nullable<ArrayBufferView> = null, destroyBuffer = true): Promise<ArrayBufferView> {
        return new Promise((resolve, reject) => {
            gpuBuffer.mapAsync(WebGPUConstants.MapMode.Read, offset, size).then(() => {
                const copyArrayBuffer = gpuBuffer.getMappedRange(offset, size);
                let data: Nullable<ArrayBufferView> | Uint8Array | Float32Array = buffer;
                if (data === null) {
                    switch (floatFormat) {
                        case 0: // byte format
                            data = new Uint8Array(size);
                            (data as Uint8Array).set(new Uint8Array(copyArrayBuffer));
                            break;
                        case 1: // half float
                            // TODO WEBGPU use computer shaders (or render pass) to make the conversion?
                            data = this._GetHalfFloatAsFloatRGBAArrayBuffer(size / 2, copyArrayBuffer);
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
                            data = this._GetHalfFloatAsFloatRGBAArrayBuffer(size / 2, copyArrayBuffer, buffer as Float32Array);
                            break;
                        case 2: // float
                            data = new Float32Array(data.buffer);
                            (data as Float32Array).set(new Float32Array(copyArrayBuffer));
                            break;
                    }
                }
                if (bytesPerRow !== bytesPerRowAligned) {
                    // TODO WEBGPU use computer shaders (or render pass) to build the final buffer data?
                    if (floatFormat === 1) {
                        // half float have been converted to float above
                        bytesPerRow *= 2;
                        bytesPerRowAligned *= 2;
                    }
                    const data2 = new Uint8Array(data!.buffer);
                    let offset = bytesPerRow, offset2 = 0;
                    for (let y = 1; y < height; ++y) {
                        offset2 = y * bytesPerRowAligned;
                        for (let x = 0; x < bytesPerRow; ++x) {
                            data2[offset++] = data2[offset2++];
                        }
                    }
                    if (floatFormat !== 0) {
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
            }, (reason) => reject(reason));
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