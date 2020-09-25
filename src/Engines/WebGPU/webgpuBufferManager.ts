import { DataBuffer } from '../../Meshes/dataBuffer';
import { WebGPUDataBuffer } from '../../Meshes/WebGPU/webgpuDataBuffer';

/** @hidden */
export class WebGPUBufferManager {

    private _device: GPUDevice;

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

    public readDataFromBuffer(buffer: GPUBuffer, size: number, offset = 0, destroyBuffer = true): Promise<Uint8Array> {
        return new Promise((resolve, reject) => {
            buffer.mapAsync(GPUMapMode.READ, offset, size).then(() => {
                const copyArrayBuffer = buffer.getMappedRange(offset, size);
                const data = new Uint8Array(size);
                data.set(new Uint8Array(copyArrayBuffer));
                buffer.unmap();
                if (destroyBuffer) {
                    buffer.destroy();
                }
                resolve(data);
            }, (reason) => reject(reason));
        });
    }
}