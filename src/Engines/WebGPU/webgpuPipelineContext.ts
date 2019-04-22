import { IPipelineContext } from '../IPipelineContext';
import { Nullable } from '../../types';
import { WebGPUEngine } from '../webgpuEngine';

/** @hidden */
export class WebGPUPipelineContext implements IPipelineContext {
    public engine: WebGPUEngine;

    public stages: Nullable<GPURenderPipelineStageDescriptor>;

    // public vertexInputDescriptor: GPUVertexAttributeDescriptor[] = [];

    public vertexShaderCode: string;
    public fragmentShaderCode: string;

    public renderPipeline: GPURenderPipeline;

    public bindGroupLayouts: (GPUBindGroupLayout | undefined)[];

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