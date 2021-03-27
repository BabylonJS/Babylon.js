import { WebGPUEngine } from "../webgpuEngine";
import { Nullable } from "../../types";
import { VertexBuffer } from "../../Meshes/buffer";
import { DataBuffer } from "../../Meshes/dataBuffer";
import * as WebGPUConstants from './webgpuConstants';

/** @hidden */
export class WebGPUSnapshotRenderer {

    private _device: GPUDevice;
    private _engine: WebGPUEngine;
    private _bundleEncoder: GPURenderBundleEncoder;

    public disabled = true;

    constructor(device: GPUDevice, engine: WebGPUEngine) {
        this._device = device;
        this._engine = engine;
    }

    private _createBundleEncoder(colorFormats: GPUTextureFormat[]): void {
        this._bundleEncoder = this._device.createRenderBundleEncoder({
            colorFormats,
            depthStencilFormat: this._engine._depthTextureFormat,
            sampleCount: this._engine.currentSampleCount,
        });
    }

    public recordDrawCall(drawType: number, start: number, count: number, instancesCount: number,
            pipeline: GPURenderPipeline, bindGroups: GPUBindGroup[], indexBuffer: Nullable<DataBuffer>, vertexBuffers: VertexBuffer[], colorFormats: GPUTextureFormat[]): boolean
    {
        if (this.disabled) {
            return false;
        }

        if (!this._bundleEncoder) {
            this._createBundleEncoder(colorFormats);
        }

        this._bundleEncoder.setPipeline(pipeline);

        if (indexBuffer) {
            this._bundleEncoder.setIndexBuffer(indexBuffer.underlyingResource, indexBuffer!.is32Bits ? WebGPUConstants.IndexFormat.Uint32 : WebGPUConstants.IndexFormat.Uint16, 0);
        }

        for (var index = 0; index < vertexBuffers.length; index++) {
            let vertexBuffer = vertexBuffers[index];
            const buffer = vertexBuffer.getBuffer();
            if (buffer) {
                this._bundleEncoder.setVertexBuffer(index, buffer.underlyingResource, vertexBuffer.byteOffset);
            }
        }

        for (let i = 0; i < bindGroups.length; i++) {
            this._bundleEncoder.setBindGroup(i, bindGroups[i]);
        }

        if (drawType === 0) {
            this._bundleEncoder.drawIndexed(count, instancesCount || 1, start, 0, 0);
        } else {
            this._bundleEncoder.draw(count, instancesCount || 1, start, 0);
        }

        return true;
    }

    public getBundle(): GPURenderBundle | undefined {
        if (!this._bundleEncoder) {
            return;
        }

        const bundle = this._bundleEncoder!.finish();

        this._bundleEncoder = undefined as any;

        return bundle;
    }
}
