import { IPipelineContext } from '../IPipelineContext';
import { Nullable } from '../../types';
import { WebGPUEngine } from '../webgpuEngine';
import { InternalTexture } from 'Materials';

/** @hidden */
export interface IWebGPUPipelineContextSamplerCache {
    textureBinding: number;

    samplerBinding: number;

    texture: InternalTexture;
}

/** @hidden */
export interface IWebGPUPipelineContextVertexInputsCache {
    indexBuffer: Nullable<GPUBuffer>;
    indexOffset: number;

    vertexStartSlot: number;
    vertexBuffers: GPUBuffer[];
    vertexOffsets: number[];
}

/** @hidden */
export class WebGPUPipelineContext implements IPipelineContext {
    public engine: WebGPUEngine;

    public vertexShaderCode: string;
    public fragmentShaderCode: string;
    public stages: Nullable<GPURenderPipelineStageDescriptor>;

    public samplers: { [name: string]: Nullable<IWebGPUPipelineContextSamplerCache> } = { };

    public vertexInputs: IWebGPUPipelineContextVertexInputsCache;

    public bindGroupLayouts: (GPUBindGroupLayout | undefined)[];
    public bindGroups: GPUBindGroup[];

    public renderPipeline: GPURenderPipeline;

    // Default implementation.
    public onCompiled?: () => void;

    public get isAsync() {
        return false;
    }

    public get isReady(): boolean {
        if (this.stages) {
            return true;
        }

        return false;
    }

    public _handlesSpectorRebuildCallback(onCompiled: (program: any) => void): void {
        // Nothing to do yet for spector.
    }
}