import { WebGPUEngine } from "../webgpuEngine";
import { Nullable } from "../../types";
import { VertexBuffer } from "../../Meshes/buffer";
import { DataBuffer } from "../../Meshes/dataBuffer";
import { WebGPUIdentifiedBindGroups } from "./webgpuCacheBindGroups";
import * as WebGPUConstants from './webgpuConstants';

class WebGPUBundleCacheNode {
    public values: { [id: number]: WebGPUBundleCacheNode };
    public bundle: GPURenderBundle;

    constructor() {
        this.values = {};
    }
}

/** @hidden */
export class WebGPUCacheBundles {

    public static NumBundlesCreatedTotal = 0;
    public static NumBundlesCreatedLastFrame = 0;

    private static _Cache: WebGPUBundleCacheNode = new WebGPUBundleCacheNode();
    private static _NumBindGroupsCreatedCurrentFrame = 0;
    private static _BundleList: GPURenderBundle[] = new Array(1000);
    private static _NumBundles = 0;

    private _device: GPUDevice;
    private _engine: WebGPUEngine;

    public disabled = false;

    constructor(device: GPUDevice, engine: WebGPUEngine) {
        this._device = device;
        this._engine = engine;
    }

    public endFrame(): void {
        WebGPUCacheBundles.NumBundlesCreatedLastFrame = WebGPUCacheBundles._NumBindGroupsCreatedCurrentFrame;
        WebGPUCacheBundles._NumBindGroupsCreatedCurrentFrame = 0;
    }

    public recordBundle(drawType: number, start: number, count: number, instancesCount: number,
            pipeline: GPURenderPipeline, identifiedBindGroups: WebGPUIdentifiedBindGroups, indexBuffer: Nullable<DataBuffer>, vertexBuffers: VertexBuffer[], colorFormats: GPUTextureFormat[]): boolean
    {
        if (this.disabled) {
            return false;
        }

        let bundle: Nullable<GPURenderBundle> = null;
        let node = WebGPUCacheBundles._Cache;

        const idPipeline = pipeline.label as any as number;
        const idBindGroups = identifiedBindGroups.id;
        const idIndexBuffer = indexBuffer?.uniqueId ?? 0;

        // note: we have 53 usable bits in a js number as all integers can be represented exactly up to 2^53
        const id0 = drawType + start * 2 + instancesCount * (2**27);
        const id1 = idBindGroups + idPipeline * (2**26);
        const id2 = idIndexBuffer + (vertexBuffers.length > 0 ? vertexBuffers[0].uniqueId * (2**26) : 0);

        let nextNode = node.values[id0];
        if (!nextNode) {
            nextNode = new WebGPUBundleCacheNode();
            node.values[id0] = nextNode;
        }
        node = nextNode;

        nextNode = node.values[count];
        if (!nextNode) {
            nextNode = new WebGPUBundleCacheNode();
            node.values[count] = nextNode;
        }
        node = nextNode;

        nextNode = node.values[id1];
        if (!nextNode) {
            nextNode = new WebGPUBundleCacheNode();
            node.values[id1] = nextNode;
        }
        node = nextNode;

        nextNode = node.values[id2];
        if (!nextNode) {
            nextNode = new WebGPUBundleCacheNode();
            node.values[id2] = nextNode;
        }
        node = nextNode;

        for (let i = 1; i < vertexBuffers.length; ++i) {
            const id = vertexBuffers[i].uniqueId;
            let nextNode = node.values[id];
            if (!nextNode) {
                nextNode = new WebGPUBundleCacheNode();
                node.values[id] = nextNode;
            }
            node = nextNode;
        }

        bundle = node.bundle;

        if (bundle) {
            WebGPUCacheBundles._BundleList[WebGPUCacheBundles._NumBundles++] = bundle;
            return true;
        }

        const bundleEncoder = this._device.createRenderBundleEncoder({
            colorFormats,
            depthStencilFormat: this._engine._depthTextureFormat,
            sampleCount: this._engine.currentSampleCount,
        });

        WebGPUCacheBundles.NumBundlesCreatedTotal++;
        WebGPUCacheBundles._NumBindGroupsCreatedCurrentFrame++;

        bundleEncoder.setPipeline(pipeline);

        if (indexBuffer) {
            bundleEncoder.setIndexBuffer(indexBuffer.underlyingResource, indexBuffer!.is32Bits ? WebGPUConstants.IndexFormat.Uint32 : WebGPUConstants.IndexFormat.Uint16, 0);
        }

        for (var index = 0; index < vertexBuffers.length; index++) {
            let vertexBuffer = vertexBuffers[index];
            const buffer = vertexBuffer.getBuffer();
            if (buffer) {
                bundleEncoder.setVertexBuffer(index, buffer.underlyingResource, vertexBuffer.byteOffset);
            }
        }

        for (let i = 0; i < identifiedBindGroups.bindGroups.length; i++) {
            bundleEncoder.setBindGroup(i, identifiedBindGroups.bindGroups[i]);
        }

        if (drawType === 0) {
            bundleEncoder.drawIndexed(count, instancesCount || 1, start, 0, 0);
        } else {
            bundleEncoder.draw(count, instancesCount || 1, start, 0);
        }

        bundle = node.bundle = bundleEncoder!.finish();

        WebGPUCacheBundles._BundleList[WebGPUCacheBundles._NumBundles++] = bundle;

        return true;
    }

    public executeBundles(renderPass: GPURenderPassEncoder): void {
        if (this.disabled) {
            return;
        }

        WebGPUCacheBundles._BundleList.length = WebGPUCacheBundles._NumBundles;

        renderPass.executeBundles(WebGPUCacheBundles._BundleList);

        WebGPUCacheBundles._NumBundles = 0;
    }
}
