import { IPipelineContext } from '../IPipelineContext';
import { Nullable } from '../../types';
import { WebGPUEngine } from '../webgpuEngine';
import { InternalTexture } from 'Materials';

/** @hidden */
export interface IWebGPUPipelineContext {
    textureBinding: number;

    samplerBinding: number;

    texture: InternalTexture;
}

/** @hidden */
export class WebGPUPipelineContext implements IPipelineContext {
    public engine: WebGPUEngine;

    public vertexShaderCode: string;
    public fragmentShaderCode: string;
    public stages: Nullable<GPURenderPipelineStageDescriptor>;

    // public vertexInputDescriptor: GPUVertexAttributeDescriptor[] = [];

    public bindGroupLayouts: (GPUBindGroupLayout | undefined)[];

    public renderPipeline: GPURenderPipeline;

    public samplers: { [name: string]: Nullable<IWebGPUPipelineContext> } = { };

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