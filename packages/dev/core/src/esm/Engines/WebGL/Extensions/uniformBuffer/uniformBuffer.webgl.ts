import type { DataBuffer } from "core/Buffers/dataBuffer";
import type { IPipelineContext } from "core/Engines/IPipelineContext";
import type { WebGLPipelineContext } from "core/Engines/WebGL/webGLPipelineContext";
import { WebGLDataBuffer } from "core/Meshes/WebGL/webGLDataBuffer";
import type { FloatArray, Nullable } from "core/types";
import type { IWebGLEnginePublic, WebGLEngineState } from "../../engine.webgl";
import type { IUniformBufferEngineExtension } from "../../../Extensions/uniformBuffer/uniformBuffer.base";

const _createUniformBuffer = function (engineState: IWebGLEnginePublic, elements: FloatArray, dynamic?: boolean): DataBuffer {
    const fes = engineState as WebGLEngineState;
    const gl = fes._gl;
    const ubo = gl.createBuffer();

    if (!ubo) {
        throw new Error("Unable to create uniform buffer");
    }
    const result = new WebGLDataBuffer(ubo);

    bindUniformBuffer(fes, result);

    if (elements instanceof Float32Array) {
        gl.bufferData(gl.UNIFORM_BUFFER, <Float32Array>elements, dynamic ? gl.STATIC_DRAW : gl.DYNAMIC_DRAW);
    } else {
        gl.bufferData(gl.UNIFORM_BUFFER, new Float32Array(<number[]>elements), dynamic ? gl.STATIC_DRAW : gl.DYNAMIC_DRAW);
    }

    bindUniformBuffer(fes, null);

    result.references = 1;
    return result;
};

export const createUniformBuffer: IUniformBufferEngineExtension["createUniformBuffer"] = function (engineState: IWebGLEnginePublic, elements: FloatArray): DataBuffer {
    return _createUniformBuffer(engineState, elements);
};

export const createDynamicUniformBuffer: IUniformBufferEngineExtension["createDynamicUniformBuffer"] = function (
    engineState: IWebGLEnginePublic,
    elements: FloatArray
): DataBuffer {
    return _createUniformBuffer(engineState, elements, true);
};

export const updateUniformBuffer: IUniformBufferEngineExtension["updateUniformBuffer"] = function (
    engineState: IWebGLEnginePublic,
    uniformBuffer: DataBuffer,
    elements: FloatArray,
    offset?: number,
    count?: number
): void {
    const fes = engineState as WebGLEngineState;
    const gl = fes._gl;
    bindUniformBuffer(fes, uniformBuffer);

    if (offset === undefined) {
        offset = 0;
    }

    if (count === undefined) {
        if (elements instanceof Float32Array) {
            gl.bufferSubData(gl.UNIFORM_BUFFER, offset, <Float32Array>elements);
        } else {
            gl.bufferSubData(gl.UNIFORM_BUFFER, offset, new Float32Array(<number[]>elements));
        }
    } else {
        if (elements instanceof Float32Array) {
            gl.bufferSubData(gl.UNIFORM_BUFFER, 0, <Float32Array>elements.subarray(offset, offset + count));
        } else {
            gl.bufferSubData(gl.UNIFORM_BUFFER, 0, new Float32Array(<number[]>elements).subarray(offset, offset + count));
        }
    }

    bindUniformBuffer(fes, null);
};

export const bindUniformBuffer: IUniformBufferEngineExtension["bindUniformBuffer"] = function (engineState: IWebGLEnginePublic, buffer: Nullable<DataBuffer>): void {
    const gl = (engineState as WebGLEngineState)._gl;
    gl.bindBuffer(gl.UNIFORM_BUFFER, buffer ? buffer.underlyingResource : null);
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const bindUniformBufferBase: IUniformBufferEngineExtension["bindUniformBufferBase"] = function (
    engineState: IWebGLEnginePublic,
    buffer: DataBuffer,
    location: number,
    _name: string
): void {
    const gl = (engineState as WebGLEngineState)._gl;
    gl.bindBufferBase(gl.UNIFORM_BUFFER, location, buffer ? buffer.underlyingResource : null);
};

export const bindUniformBlock: IUniformBufferEngineExtension["bindUniformBlock"] = function (
    engineState: IWebGLEnginePublic,
    pipelineContext: IPipelineContext,
    blockName: string,
    index: number
): void {
    const program = (pipelineContext as WebGLPipelineContext).program!;
    const gl = (engineState as WebGLEngineState)._gl;

    const uniformLocation = gl.getUniformBlockIndex(program, blockName);

    if (uniformLocation !== 0xffffffff) {
        gl.uniformBlockBinding(program, uniformLocation, index);
    }
};

export const uniformBufferExtension: IUniformBufferEngineExtension = {
    createUniformBuffer,
    createDynamicUniformBuffer,
    updateUniformBuffer,
    bindUniformBuffer,
    bindUniformBufferBase,
    bindUniformBlock,
};

export default uniformBufferExtension;
