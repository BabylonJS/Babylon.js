import type { Effect } from "../../Materials/effect";
import type { InternalTexture } from "../../Materials/Textures/internalTexture";
import type { IColor4Like } from "../../Maths/math.like";
import type { VertexBuffer } from "../../Buffers/buffer";
import type { WebGPUDataBuffer } from "../../Meshes/WebGPU/webgpuDataBuffer";
import type { Nullable } from "../../types";
import { Constants } from "../constants";
import type { WebGPUEngine } from "../webgpuEngine";
import type { WebGPUCacheRenderPipeline } from "./webgpuCacheRenderPipeline";
import { WebGPUCacheRenderPipelineTree } from "./webgpuCacheRenderPipelineTree";
import type { WebGPUPipelineContext } from "./webgpuPipelineContext";
import { WebGPUShaderProcessingContext } from "./webgpuShaderProcessingContext";
import { WebGPUTextureHelper } from "./webgpuTextureHelper";
import { renderableTextureFormatToIndex } from "./webgpuTextureManager";

import "../../Shaders/clearQuad.vertex";
import "../../Shaders/clearQuad.fragment";

/** @internal */
export class WebGPUClearQuad {
    private _device: GPUDevice;
    private _engine: WebGPUEngine;
    private _cacheRenderPipeline: WebGPUCacheRenderPipeline;
    private _effect: Effect;
    private _bindGroups: { [id: string]: GPUBindGroup[] } = {};
    private _depthTextureFormat: GPUTextureFormat | undefined;
    private _bundleCache: { [key: string]: GPURenderBundle } = {};
    private _keyTemp: number[] = [];

    public setDepthStencilFormat(format: GPUTextureFormat | undefined): void {
        this._depthTextureFormat = format;
        this._cacheRenderPipeline.setDepthStencilFormat(format);
    }

    public setColorFormat(format: GPUTextureFormat | null): void {
        this._cacheRenderPipeline.setColorFormat(format);
    }

    public setMRTAttachments(attachments: number[], textureArray: InternalTexture[], textureCount: number): void {
        this._cacheRenderPipeline.setMRT(textureArray, textureCount);
        this._cacheRenderPipeline.setMRTAttachments(attachments);
    }

    constructor(device: GPUDevice, engine: WebGPUEngine, emptyVertexBuffer: VertexBuffer) {
        this._device = device;
        this._engine = engine;

        this._cacheRenderPipeline = new WebGPUCacheRenderPipelineTree(this._device, emptyVertexBuffer);
        this._cacheRenderPipeline.setDepthTestEnabled(false);
        this._cacheRenderPipeline.setStencilReadMask(0xff);

        this._effect = engine.createEffect("clearQuad", [], ["color", "depthValue"]);
    }

    public clear(
        renderPass: Nullable<GPURenderPassEncoder>,
        clearColor?: Nullable<IColor4Like>,
        clearDepth?: boolean,
        clearStencil?: boolean,
        sampleCount = 1
    ): Nullable<GPURenderBundle> {
        let renderPass2: GPURenderPassEncoder | GPURenderBundleEncoder;
        let bundle: Nullable<GPURenderBundle> = null;
        let bundleKey: string;

        const isRTTPass = !!this._engine._currentRenderTarget;

        if (renderPass) {
            renderPass2 = renderPass;
        } else {
            let idx = 0;
            this._keyTemp.length = 0;
            for (let i = 0; i < this._cacheRenderPipeline.colorFormats.length; ++i) {
                this._keyTemp[idx++] = renderableTextureFormatToIndex[this._cacheRenderPipeline.colorFormats[i] ?? ""];
            }

            const depthStencilFormatIndex = renderableTextureFormatToIndex[this._depthTextureFormat ?? 0];

            this._keyTemp[idx] =
                (clearColor ? clearColor.r + clearColor.g * 256 + clearColor.b * 256 * 256 + clearColor.a * 256 * 256 * 256 : 0) +
                (clearDepth ? 2 ** 32 : 0) +
                (clearStencil ? 2 ** 33 : 0) +
                (this._engine.useReverseDepthBuffer ? 2 ** 34 : 0) +
                (isRTTPass ? 2 ** 35 : 0) +
                (sampleCount > 1 ? 2 ** 36 : 0) +
                depthStencilFormatIndex * 2 ** 37;

            bundleKey = this._keyTemp.join("_");
            bundle = this._bundleCache[bundleKey];

            if (bundle) {
                return bundle;
            }

            renderPass2 = this._device.createRenderBundleEncoder({
                colorFormats: this._cacheRenderPipeline.colorFormats,
                depthStencilFormat: this._depthTextureFormat,
                sampleCount: WebGPUTextureHelper.GetSample(sampleCount),
            });
        }

        this._cacheRenderPipeline.setDepthWriteEnabled(!!clearDepth);
        this._cacheRenderPipeline.setStencilEnabled(!!clearStencil && !!this._depthTextureFormat && WebGPUTextureHelper.HasStencilAspect(this._depthTextureFormat));
        this._cacheRenderPipeline.setStencilWriteMask(clearStencil ? 0xff : 0);
        this._cacheRenderPipeline.setStencilCompare(clearStencil ? Constants.ALWAYS : Constants.NEVER);
        this._cacheRenderPipeline.setStencilPassOp(clearStencil ? Constants.REPLACE : Constants.KEEP);
        this._cacheRenderPipeline.setWriteMask(clearColor ? 0xf : 0);

        const pipeline = this._cacheRenderPipeline.getRenderPipeline(Constants.MATERIAL_TriangleStripDrawMode, this._effect, sampleCount);

        const webgpuPipelineContext = this._effect._pipelineContext as WebGPUPipelineContext;

        if (clearColor) {
            this._effect.setDirectColor4("color", clearColor);
        }

        this._effect.setFloat("depthValue", this._engine.useReverseDepthBuffer ? this._engine._clearReverseDepthValue : this._engine._clearDepthValue);

        webgpuPipelineContext.uniformBuffer!.update();

        const bufferInternals = isRTTPass ? this._engine._ubInvertY : this._engine._ubDontInvertY;
        const bufferLeftOver = webgpuPipelineContext.uniformBuffer!.getBuffer() as WebGPUDataBuffer;

        const key = bufferLeftOver.uniqueId + "-" + bufferInternals.uniqueId;

        let bindGroups = this._bindGroups[key];

        if (!bindGroups) {
            const bindGroupLayouts = webgpuPipelineContext.bindGroupLayouts[0];
            bindGroups = this._bindGroups[key] = [];
            bindGroups.push(
                this._device.createBindGroup({
                    layout: bindGroupLayouts[0],
                    entries: [],
                })
            );
            if (!WebGPUShaderProcessingContext._SimplifiedKnownBindings) {
                bindGroups.push(
                    this._device.createBindGroup({
                        layout: bindGroupLayouts[1],
                        entries: [],
                    })
                );
            }
            bindGroups.push(
                this._device.createBindGroup({
                    layout: bindGroupLayouts[WebGPUShaderProcessingContext._SimplifiedKnownBindings ? 1 : 2],
                    entries: [
                        {
                            binding: 0,
                            resource: {
                                buffer: bufferInternals.underlyingResource,
                                size: bufferInternals.capacity,
                            },
                        },
                        {
                            binding: 1,
                            resource: {
                                buffer: bufferLeftOver.underlyingResource,
                                size: bufferLeftOver.capacity,
                            },
                        },
                    ],
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
            this._bundleCache[bundleKey!] = bundle;
        }

        return bundle;
    }
}
