import type { DataBuffer } from "core/Buffers/dataBuffer";
import type { IWebGLEnginePublic, WebGLEngineState } from "../../engine.webgl";
import type { Nullable } from "core/types";
import type { ITransformFeedbackEngineExtension } from "../../../Extensions/transformFeedback/engine.transformFeedback.base";

export const createTransformFeedback: ITransformFeedbackEngineExtension["createTransformFeedback"] = (engineState: IWebGLEnginePublic): WebGLTransformFeedback => {
    const gl = (engineState as WebGLEngineState)._gl;
    const transformFeedback = gl.createTransformFeedback();
    if (!transformFeedback) {
        throw new Error("Unable to create Transform Feedback");
    }
    return transformFeedback;
};

export const deleteTransformFeedback: ITransformFeedbackEngineExtension["deleteTransformFeedback"] = (engineState: IWebGLEnginePublic, value: WebGLTransformFeedback): void => {
    const gl = (engineState as WebGLEngineState)._gl;
    gl.deleteTransformFeedback(value);
};

export const bindTransformFeedback: ITransformFeedbackEngineExtension["bindTransformFeedback"] = (
    engineState: IWebGLEnginePublic,
    value: Nullable<WebGLTransformFeedback>
): void => {
    const gl = (engineState as WebGLEngineState)._gl;
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, value);
};

export const beginTransformFeedback: ITransformFeedbackEngineExtension["beginTransformFeedback"] = (engineState: IWebGLEnginePublic, usePoints: boolean = true): void => {
    const gl = (engineState as WebGLEngineState)._gl;
    gl.beginTransformFeedback(usePoints ? gl.POINTS : gl.TRIANGLES);
};

export const endTransformFeedback: ITransformFeedbackEngineExtension["endTransformFeedback"] = (engineState: IWebGLEnginePublic): void => {
    const gl = (engineState as WebGLEngineState)._gl;
    gl.endTransformFeedback();
};

export const setTransformFeedbackVaryings: ITransformFeedbackEngineExtension["setTransformFeedbackVaryings"] = (
    engineState: IWebGLEnginePublic,
    program: WebGLProgram,
    value: string[]
): void => {
    const gl = (engineState as WebGLEngineState)._gl;
    gl.transformFeedbackVaryings(program, value, gl.INTERLEAVED_ATTRIBS);
};

// back compat
export const setTranformFeedbackVaryings = setTransformFeedbackVaryings;

export const bindTransformFeedbackBuffer: ITransformFeedbackEngineExtension["bindTransformFeedbackBuffer"] = (
    engineState: IWebGLEnginePublic,
    value: Nullable<DataBuffer>
): void => {
    const gl = (engineState as WebGLEngineState)._gl;
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, value ? value.underlyingResource : null);
};

export const transformFeedbackEngineExtension: ITransformFeedbackEngineExtension = {
    createTransformFeedback,
    deleteTransformFeedback,
    bindTransformFeedback,
    beginTransformFeedback,
    endTransformFeedback,
    setTransformFeedbackVaryings,
    bindTransformFeedbackBuffer,
};

export default transformFeedbackEngineExtension;
