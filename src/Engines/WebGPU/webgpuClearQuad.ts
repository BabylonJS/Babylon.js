import { Effect } from "../../Materials/effect";
import { IColor4Like } from "../../Maths/math.like";
import { VertexBuffer } from "../../Meshes/buffer";
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

    public setDepthStencilFormat(format: GPUTextureFormat | undefined): void {
        this._cacheRenderPipeline.setDepthStencilFormat(format);
    }

    public setColorFormat(format: GPUTextureFormat): void {
        this._cacheRenderPipeline.setColorFormat(format);
    }

    constructor(device: GPUDevice, engine: WebGPUEngine, emptyVertexBuffer: VertexBuffer) {
        this._device = device;
        this._engine = engine;

        this._cacheRenderPipeline = new WebGPUCacheRenderPipelineTree(this._device, emptyVertexBuffer);
        this._cacheRenderPipeline.setDepthTestEnabled(false);
        this._cacheRenderPipeline.setStencilReadMask(0xFF);

        this._effect = engine.createEffect("clearQuad", [], ["color", "depthValue"]);
    }

    public clear(renderPass: GPURenderPassEncoder, clearColor?: Nullable<IColor4Like>, clearDepth?: boolean, clearStencil?: boolean, sampleCount = 1) {
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
                        },
                    }],
                })
            );
        }

        renderPass.setStencilReference(this._engine._clearStencilValue);
        renderPass.setPipeline(pipeline);
        for (let i = 0; i < bindGroups.length; ++i) {
            renderPass.setBindGroup(i, bindGroups[i]);
        }
        renderPass.draw(4, 1, 0, 0);
    }
}
