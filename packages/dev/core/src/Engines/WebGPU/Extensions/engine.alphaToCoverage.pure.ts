/** This file must only contain pure code and pure imports */

import { ThinWebGPUEngine } from "../../thinWebGPUEngine";
import { WebGPUCacheRenderPipeline } from "../webgpuCacheRenderPipeline";
import { type Effect } from "../../../Materials/effect.pure";

interface IWebGPUCacheRenderPipelineInternals {
    _alphaToCoverageEnabled: boolean;
    _buildRenderPipelineDescriptor(effect: Effect, topology: GPUPrimitiveTopology, sampleCount: number): GPURenderPipelineDescriptor;
}

let _Registered = false;
/**
 * Registers alpha-to-coverage support for WebGPU engines.
 * Safe to call multiple times; only the first call has an effect.
 */
export function RegisterEnginesWebGPUExtensionsEngineAlphaToCoverage(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    const alphaToCoverageState = new WeakMap<ThinWebGPUEngine, boolean>();

    ThinWebGPUEngine.prototype.getAlphaToCoverage = function (): boolean {
        return alphaToCoverageState.get(this) ?? false;
    };

    ThinWebGPUEngine.prototype.setAlphaToCoverage = function (enable: boolean): void {
        const pipelineCache = this._cacheRenderPipeline as unknown as IWebGPUCacheRenderPipelineInternals;
        if ((alphaToCoverageState.get(this) ?? false) === enable && pipelineCache._alphaToCoverageEnabled === enable) {
            return;
        }

        alphaToCoverageState.set(this, enable);
        this._cacheRenderPipeline.setAlphaToCoverage(enable);
    };

    const pipelinePrototype = WebGPUCacheRenderPipeline.prototype as unknown as IWebGPUCacheRenderPipelineInternals;
    const buildRenderPipelineDescriptor = pipelinePrototype._buildRenderPipelineDescriptor;

    pipelinePrototype._buildRenderPipelineDescriptor = function (effect: Effect, topology: GPUPrimitiveTopology, sampleCount: number): GPURenderPipelineDescriptor {
        const descriptor = buildRenderPipelineDescriptor.call(this, effect, topology, sampleCount);
        descriptor.multisample!.alphaToCoverageEnabled = this._alphaToCoverageEnabled && sampleCount > 1;
        return descriptor;
    };
}
