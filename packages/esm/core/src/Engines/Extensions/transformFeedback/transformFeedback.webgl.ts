import type { DataBuffer } from "core/Buffers/dataBuffer";
import type { IWebGLEnginePublic, WebGLEngineState } from "../../engine.webgl";
import type { Nullable } from "core/types";

export function createTransformFeedback(engineState: IWebGLEnginePublic): WebGLTransformFeedback {
    const gl = (engineState as WebGLEngineState)._gl;
    const transformFeedback = gl.createTransformFeedback();
    if (!transformFeedback) {
        throw new Error("Unable to create Transform Feedback");
    }
    return transformFeedback;
}

export function deleteTransformFeedback(engineState: IWebGLEnginePublic, value: WebGLTransformFeedback): void {
    const gl = (engineState as WebGLEngineState)._gl;
    gl.deleteTransformFeedback(value);
}

export function bindTransformFeedback(engineState: IWebGLEnginePublic, value: Nullable<WebGLTransformFeedback>): void {
    const gl = (engineState as WebGLEngineState)._gl;
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, value);
}

export function beginTransformFeedback(engineState: IWebGLEnginePublic, usePoints: boolean = true): void {
    const gl = (engineState as WebGLEngineState)._gl;
    gl.beginTransformFeedback(usePoints ? gl.POINTS : gl.TRIANGLES);
}

export function endTransformFeedback(engineState: IWebGLEnginePublic): void {
    const gl = (engineState as WebGLEngineState)._gl;
    gl.endTransformFeedback();
}

export function setTranformFeedbackVaryings(engineState: IWebGLEnginePublic, program: WebGLProgram, value: string[]): void {
    const gl = (engineState as WebGLEngineState)._gl;
    gl.transformFeedbackVaryings(program, value, gl.INTERLEAVED_ATTRIBS);
}

export function bindTransformFeedbackBuffer(engineState: IWebGLEnginePublic, value: Nullable<DataBuffer>): void {
    const gl = (engineState as WebGLEngineState)._gl;
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, value ? value.underlyingResource : null);
}
