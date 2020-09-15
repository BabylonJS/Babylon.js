import { DataBuffer } from '../../Meshes/dataBuffer';
import { WebGPUDataBuffer } from '../../Meshes/WebGPU/webgpuDataBuffer';

/** @hidden */
export class WebGPUBufferManager {

    private _device: GPUDevice;

    constructor(device: GPUDevice) {
        this._device = device;
    }

    public createBuffer(view: ArrayBufferView, flags: GPUBufferUsageFlags): DataBuffer {
        const alignedLength = (view.byteLength + 3) & ~3; // 4 bytes alignments (because of the upload which requires this)
        const verticesBufferDescriptor = {
            size: alignedLength,
            usage: flags
        };
        const buffer = this._device.createBuffer(verticesBufferDescriptor);
        const dataBuffer = new WebGPUDataBuffer(buffer);
        dataBuffer.references = 1;
        dataBuffer.capacity = view.byteLength;

        this.setSubData(dataBuffer, 0, view);

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
            tempView.forEach((element, index) => {
                (src as Uint8Array)[index] = element;
            });
            srcByteOffset = 0;
            chunkStart = 0;
            chunkEnd = alignedLength;
            byteLength = alignedLength;
        }

        // Chunk
        const maxChunk = 1024 * 1024 * 15;
        let offset = 0;
        while ((chunkEnd - (chunkStart + offset)) > maxChunk) {
            this._device.defaultQueue.writeBuffer(buffer, dstByteOffset + offset, src.buffer, chunkStart + offset, maxChunk);
            offset += maxChunk;
        }

        this._device.defaultQueue.writeBuffer(buffer, dstByteOffset + offset, src.buffer, chunkStart + offset, byteLength - offset);
    }

}