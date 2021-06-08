import { DataBuffer } from "../../../Buffers/dataBuffer";
import { WebGPUDataBuffer } from "../../../Meshes/WebGPU/webgpuDataBuffer";
import { FloatArray } from "../../../types";
import { IPipelineContext } from "../../IPipelineContext";
import { WebGPUEngine } from "../../webgpuEngine";
import * as WebGPUConstants from '../webgpuConstants';

WebGPUEngine.prototype.createUniformBuffer = function(elements: FloatArray): DataBuffer {
    let view: Float32Array;
    if (elements instanceof Array) {
        view = new Float32Array(elements);
    }
    else {
        view = elements;
    }

    const dataBuffer = this._bufferManager.createBuffer(view, WebGPUConstants.BufferUsage.Uniform | WebGPUConstants.BufferUsage.CopyDst);
    return dataBuffer;
};

WebGPUEngine.prototype.createDynamicUniformBuffer = function(elements: FloatArray): DataBuffer {
    return this.createUniformBuffer(elements);
};

WebGPUEngine.prototype.updateUniformBuffer = function(uniformBuffer: DataBuffer, elements: FloatArray, offset?: number, count?: number): void {
    if (offset === undefined) {
        offset = 0;
    }

    const dataBuffer = uniformBuffer as WebGPUDataBuffer;
    let view: Float32Array;
    if (count === undefined) {
        if (elements instanceof Float32Array) {
            view = elements;
        } else {
            view = new Float32Array(elements);
        }
        count = view.byteLength;
    } else {
        if (elements instanceof Float32Array) {
            view = elements;
        } else {
            view = new Float32Array(elements);
        }
    }

    this._bufferManager.setSubData(dataBuffer, offset, view, 0, count);
};

WebGPUEngine.prototype.bindUniformBufferBase = function(buffer: DataBuffer, location: number, name: string): void {
    this._uniformsBuffers[name] = buffer as WebGPUDataBuffer;
};

WebGPUEngine.prototype.bindUniformBlock = function(pipelineContext: IPipelineContext, blockName: string, index: number): void {
};
