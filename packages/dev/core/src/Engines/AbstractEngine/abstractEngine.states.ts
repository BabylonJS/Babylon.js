import type { Nullable } from "../../types";
import { AbstractEngine } from "../abstractEngine";
import { Constants } from "../constants";

declare module "../../Engines/abstractEngine" {
    export interface AbstractEngine {
        /**
         * Gets the current depth function
         * @returns a number defining the depth function
         */
        getDepthFunction(): Nullable<number>;

        /**
         * Sets the current depth function
         * @param depthFunc defines the function to use
         */
        setDepthFunction(depthFunc: number): void;

        /**
         * Sets the current depth function to GREATER
         */
        setDepthFunctionToGreater(): void;

        /**
         * Sets the current depth function to GEQUAL
         */
        setDepthFunctionToGreaterOrEqual(): void;

        /**
         * Sets the current depth function to LESS
         */
        setDepthFunctionToLess(): void;

        /**
         * Sets the current depth function to LEQUAL
         */
        setDepthFunctionToLessOrEqual(): void;

        /**
         * Gets a boolean indicating if depth writing is enabled
         * @returns the current depth writing state
         */
        getDepthWrite(): boolean;

        /**
         * Enable or disable depth writing
         * @param enable defines the state to set
         */
        setDepthWrite(enable: boolean): void;
    }
}

AbstractEngine.prototype.getInputElement = function (): Nullable<HTMLElement> {
    return this._renderingCanvas;
};

AbstractEngine.prototype.getDepthFunction = function (): Nullable<number> {
    return this._depthCullingState.depthFunc;
};

AbstractEngine.prototype.setDepthFunction = function (depthFunc: number) {
    this._depthCullingState.depthFunc = depthFunc;
};

AbstractEngine.prototype.setDepthFunctionToGreater = function (): void {
    this.setDepthFunction(Constants.GREATER);
};

AbstractEngine.prototype.setDepthFunctionToGreaterOrEqual = function (): void {
    this.setDepthFunction(Constants.GEQUAL);
};

AbstractEngine.prototype.setDepthFunctionToLess = function (): void {
    this.setDepthFunction(Constants.LESS);
};
AbstractEngine.prototype.setDepthFunctionToLessOrEqual = function (): void {
    this.setDepthFunction(Constants.LEQUAL);
};

AbstractEngine.prototype.getDepthWrite = function (): boolean {
    return this._depthCullingState.depthMask;
};

AbstractEngine.prototype.setDepthWrite = function (enable: boolean): void {
    this._depthCullingState.depthMask = enable;
};
