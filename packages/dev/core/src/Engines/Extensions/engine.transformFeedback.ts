import type { Nullable } from "../../types";
import { Engine } from "../../Engines/engine";
import type { DataBuffer } from "../../Buffers/dataBuffer";
import * as extension from "core/esm/Engines/WebGL/Extensions/transformFeedback/engine.transformFeedback.webgl";
import { EngineExtensions, loadExtension } from "core/esm/Engines/Extensions/engine.extensions";

/** @internal */
// eslint-disable-next-line no-var
export var _forceTransformFeedbackToBundle = true;

declare module "../../Engines/engine" {
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
    }
}

Engine.prototype.createTransformFeedback = function (): WebGLTransformFeedback {
    return extension.createTransformFeedback(this._engineState);
};

Engine.prototype.deleteTransformFeedback = function (value: WebGLTransformFeedback): void {
    extension.deleteTransformFeedback(this._engineState, value);
};

Engine.prototype.bindTransformFeedback = function (value: Nullable<WebGLTransformFeedback>): void {
    extension.bindTransformFeedback(this._engineState, value);
};

Engine.prototype.beginTransformFeedback = function (usePoints: boolean = true): void {
    extension.beginTransformFeedback(this._engineState, usePoints);
};

Engine.prototype.endTransformFeedback = function (): void {
    extension.endTransformFeedback(this._engineState);
};

Engine.prototype.setTranformFeedbackVaryings = function (program: WebGLProgram, value: string[]): void {
    extension.setTranformFeedbackVaryings(this._engineState, program, value);
};

Engine.prototype.bindTransformFeedbackBuffer = function (value: Nullable<DataBuffer>): void {
    extension.bindTransformFeedbackBuffer(this._engineState, value);
};

loadExtension(EngineExtensions.TRANSFORM_FEEDBACK, extension);
