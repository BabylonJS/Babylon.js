import type { DataBuffer } from "core/Buffers/dataBuffer.js";
import type { Nullable } from "core/types.js";
import type { IBaseEnginePublic } from "../../engine.base.js";

export const name = "transformFeedback";

export interface ITransformFeedbackEngineExtension {
    /**
     * Creates a webGL transform feedback object
     * Please makes sure to check webGLVersion property to check if you are running webGL 2+
     * @returns the webGL transform feedback object
     */
    createTransformFeedback(engineState: IBaseEnginePublic): WebGLTransformFeedback;

    /**
     * Delete a webGL transform feedback object
     * @param value defines the webGL transform feedback object to delete
     */
    deleteTransformFeedback(engineState: IBaseEnginePublic, value: WebGLTransformFeedback): void;

    /**
     * Bind a webGL transform feedback object to the webgl context
     * @param value defines the webGL transform feedback object to bind
     */
    bindTransformFeedback(engineState: IBaseEnginePublic, value: Nullable<WebGLTransformFeedback>): void;

    /**
     * Begins a transform feedback operation
     * @param usePoints defines if points or triangles must be used
     */
    beginTransformFeedback(engineState: IBaseEnginePublic, usePoints: boolean): void;

    /**
     * Ends a transform feedback operation
     */
    endTransformFeedback(engineState: IBaseEnginePublic): void;

    /**
     * Specify the varyings to use with transform feedback
     * @param program defines the associated webGL program
     * @param value defines the list of strings representing the varying names
     */
    setTransformFeedbackVaryings(engineState: IBaseEnginePublic, program: WebGLProgram, value: string[]): void;

    /**
     * Bind a webGL buffer for a transform feedback operation
     * @param value defines the webGL buffer to bind
     */
    bindTransformFeedbackBuffer(engineState: IBaseEnginePublic, value: Nullable<DataBuffer>): void;
}
