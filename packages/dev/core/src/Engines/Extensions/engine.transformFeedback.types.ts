import { type Nullable } from "../../types";
import { type DataBuffer } from "../../Buffers/dataBuffer";
declare module "../../Engines/engine.pure" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface Engine {
        /**
         * Creates a webGL transform feedback object
         * Please makes sure to check webGLVersion property to check if you are running webGL 2+
         * @returns the webGL transform feedback object
         */
        createTransformFeedback(): WebGLTransformFeedback;

        /**
         * Delete a webGL transform feedback object
         * @param value defines the webGL transform feedback object to delete
         */
        deleteTransformFeedback(value: WebGLTransformFeedback): void;

        /**
         * Bind a webGL transform feedback object to the webgl context
         * @param value defines the webGL transform feedback object to bind
         */
        bindTransformFeedback(value: Nullable<WebGLTransformFeedback>): void;

        /**
         * Begins a transform feedback operation
         * @param usePoints defines if points or triangles must be used
         */
        beginTransformFeedback(usePoints: boolean): void;

        /**
         * Ends a transform feedback operation
         */
        endTransformFeedback(): void;

        /**
         * Specify the varyings to use with transform feedback
         * @param program defines the associated webGL program
         * @param value defines the list of strings representing the varying names
         */
        setTranformFeedbackVaryings(program: WebGLProgram, value: string[]): void;

        /**
         * Bind a webGL buffer for a transform feedback operation
         * @param value defines the webGL buffer to bind
         */
        bindTransformFeedbackBuffer(value: Nullable<DataBuffer>): void;

        /**
         * Read data back from the bound transform feedback buffer
         * @param target defines the webGL buffer to write to
         */
        readTransformFeedbackBuffer(target: ArrayBufferView): void;
    }
}
