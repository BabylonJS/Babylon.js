import { Effect } from "../../Materials/effect";
import { InternalTexture } from "../../Materials/Textures/internalTexture";
import { IColor4Like } from "../../Maths/math.like";
import { VertexBuffer } from "../../Buffers/buffer";
import { WebGPUDataBuffer } from "../../Meshes/WebGPU/webgpuDataBuffer";
import { Nullable } from "../../types";
import { Constants } from "../constants";
import { WebGPUEngine } from "../webgpuEngine";
import { WebGPUCacheRenderPipeline } from "./webgpuCacheRenderPipeline";
import { WebGPUCacheRenderPipelineTree } from "./webgpuCacheRenderPipelineTree";
import { WebGPUPipelineContext } from "./webgpuPipelineContext";

/** @hidden */
export class WebGPUClearQuad {

    private _device: GPUDevice;
    private _engine: WebGPUEngine;
    private _cacheRenderPipeline: WebGPUCacheRenderPipeline;
    private _effect: Effect;
    private _bindGroups: { [id: number]: GPUBindGroup[] } = {};
    private _depthTextureFormat: GPUTextureFormat | undefined;
    private _bundleCache: { [key: number]: GPURenderBundle } = {};

    public setDepthStencilFormat(format: GPUTextureFormat | undefined): void {
        this._depthTextureFormat = format;
        this._cacheRenderPipeline.setDepthStencilFormat(format);
    }

    public setColorFormat(format: GPUTextureFormat): void {
        this._cacheRenderPipeline.setColorFormat(format);
    }

    public setMRTAttachments(attachments: number[], textureArray: InternalTexture[]): void {
        this._cacheRenderPipeline.setMRTAttachments(attachments, textureArray);
    }

    constructor(device: GPUDevice, engine: WebGPUEngine, emptyVertexBuffer: VertexBuffer) {
        this._device = device;
        this._engine = engine;

        this._cacheRenderPipeline = new WebGPUCacheRenderPipelineTree(this._device, emptyVertexBuffer);
        this._cacheRenderPipeline.setDepthTestEnabled(false);
        this._cacheRenderPipeline.setStencilReadMask(0xFF);

        this._effect = engine.createEffect("clearQuad", [], ["color", "depthValue"]);
    }

    public clear(renderPass: Nullable<GPURenderPassEncoder>, clearColor?: Nullable<IColor4Like>, clearDepth?: boolean, clearStencil?: boolean, sampleCount = 1): Nullable<GPURenderBundle> {
        let renderPass2: GPURenderPassEncoder | GPURenderBundleEncoder;
        let bundle: Nullable<GPURenderBundle> = null;
        let bundleKey = 0;

        if (renderPass) {
            renderPass2 = renderPass;
        } else {
            bundleKey = (clearColor ? clearColor.r + clearColor.g * 256 + clearColor.b * 256 * 256 + clearColor.a * 256 * 256 * 256 : 0) +
                (clearDepth ? 2 ** 32 : 0) +
                (clearStencil ? 2 ** 33 : 0) +
                (this._engine.useReverseDepthBuffer ? 2 ** 34 : 0) +
                sampleCount * (2 ** 35);

            bundle = this._bundleCache[bundleKey];

            if (bundle) {
                return bundle;
            }

            renderPass2 = this._device.createRenderBundleEncoder({
                colorFormats: this._cacheRenderPipeline.colorFormats,
                depthStencilFormat: this._depthTextureFormat,
                sampleCount,
            });
        }

        this._cacheRenderPipeline.setDepthWriteEnabled(!!clearDepth);
        this._cacheRenderPipeline.setStencilEnabled(!!clearStencil);
        this._cacheRenderPipeline.setStencilWriteMask(clearStencil ? 0xFF : 0);
        this._cacheRenderPipeline.setStencilCompare(clearStencil ? Constants.ALWAYS : Constants.NEVER);
        this._cacheRenderPipeline.setStencilPassOp(clearStencil ? Constants.REPLACE : Constants.KEEP);
        this._cacheRenderPipeline.setWriteMask(clearColor ? 0xF : 0);

        const pipeline = this._cacheRenderPipeline.getRenderPipeline(Constants.MATERIAL_TriangleStripDrawMode, this._effect, sampleCount);

        const webgpuPipelineContext = this._effect._pipelineContext as WebGPUPipelineContext;

        if (clearColor) {
            this._effect.setDirectColor4("color", clearColor);
        }

        this._effect.setFloat("depthValue", this._engine.useReverseDepthBuffer ? this._engine._clearReverseDepthValue : this._engine._clearDepthValue);

        webgpuPipelineContext.uniformBuffer?.update();

        const buffer = webgpuPipelineContext.uniformBuffer?.getBuffer() as WebGPUDataBuffer;
        let bindGroups = this._bindGroups[buffer.uniqueId];

        if (!bindGroups) {
            const bindGroupLayouts = webgpuPipelineContext.bindGroupLayouts;
            bindGroups = this._bindGroups[buffer.uniqueId] = [];
            bindGroups.push(
                this._device.createBindGroup({
                    layout: bindGroupLayouts[0],
                    entries: []
                }),
                this._device.createBindGroup({
                    layout: bindGroupLayouts[1],
                    entries: []
                }),
                this._device.createBindGroup({
                    layout: bindGroupLayouts[2],
                    entries: [{
                        binding: 0,
                        resource: {
                            buffer: buffer.underlyingResource,
                            size: buffer.capacity
                        },
                    }],
                })
            );
        }

        renderPass2.setPipeline(pipeline);
        for (let i = 0; i < bindGroups.length; ++i) {
            renderPass2.setBindGroup(i, bindGroups[i]);
        }
        renderPass2.draw(4, 1, 0, 0);

        if (!renderPass) {
            bundle = (renderPass2 as GPURenderBundleEncoder).finish();
            this._bundleCache[bundleKey] = bundle;
        }

        return bundle;
    }
}
