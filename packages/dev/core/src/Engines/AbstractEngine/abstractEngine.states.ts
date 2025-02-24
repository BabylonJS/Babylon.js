import type { Nullable } from "../../types";
import { AbstractEngine } from "../abstractEngine";
import { Constants } from "../constants";

import "./abstractEngine.alpha";

declare module "../../Engines/abstractEngine" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface AbstractEngine {
        /** @internal */
        _cachedStencilBuffer: boolean;
        /** @internal */
        _cachedStencilFunction: number;
        /** @internal */
        _cachedStencilMask: number;
        /** @internal */
        _cachedStencilOperationPass: number;
        /** @internal */
        _cachedStencilOperationFail: number;
        /** @internal */
        _cachedStencilOperationDepthFail: number;
        /** @internal */
        _cachedStencilReference: number;

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

        /**
         * Gets the current stencil operation when stencil passes
         * @returns a number defining stencil operation to use when stencil passes
         */
        getStencilOperationPass(): number;

        /**
         * Gets a boolean indicating if stencil buffer is enabled
         * @returns the current stencil buffer state
         */
        getStencilBuffer(): boolean;

        /**
         * Enable or disable the stencil buffer
         * @param enable defines if the stencil buffer must be enabled or disabled
         */
        setStencilBuffer(enable: boolean): void;

        /**
         * Gets the current stencil mask
         * @returns a number defining the new stencil mask to use
         */
        getStencilMask(): number;
        /**
         * Sets the current stencil mask
         * @param mask defines the new stencil mask to use
         */
        setStencilMask(mask: number): void;

        /**
         * Gets the current stencil function
         * @returns a number defining the stencil function to use
         */
        getStencilFunction(): number;

        /**
         * Gets the current stencil reference value
         * @returns a number defining the stencil reference value to use
         */
        getStencilFunctionReference(): number;

        /**
         * Gets the current stencil mask
         * @returns a number defining the stencil mask to use
         */
        getStencilFunctionMask(): number;

        /**
         * Sets the current stencil function
         * @param stencilFunc defines the new stencil function to use
         */
        setStencilFunction(stencilFunc: number): void;

        /**
         * Sets the current stencil reference
         * @param reference defines the new stencil reference to use
         */
        setStencilFunctionReference(reference: number): void;

        /**
         * Sets the current stencil mask
         * @param mask defines the new stencil mask to use
         */
        setStencilFunctionMask(mask: number): void;

        /**
         * Gets the current stencil operation when stencil fails
         * @returns a number defining stencil operation to use when stencil fails
         */
        getStencilOperationFail(): number;

        /**
         * Gets the current stencil operation when depth fails
         * @returns a number defining stencil operation to use when depth fails
         */
        getStencilOperationDepthFail(): number;

        /**
         * Sets the stencil operation to use when stencil fails
         * @param operation defines the stencil operation to use when stencil fails
         */
        setStencilOperationFail(operation: number): void;

        /**
         * Sets the stencil operation to use when depth fails
         * @param operation defines the stencil operation to use when depth fails
         */
        setStencilOperationDepthFail(operation: number): void;

        /**
         * Sets the stencil operation to use when stencil passes
         * @param operation defines the stencil operation to use when stencil passes
         */
        setStencilOperationPass(operation: number): void;

        /**
         * Caches the state of the stencil buffer
         */
        cacheStencilState(): void;

        /**
         * Restores the state of the stencil buffer
         */
        restoreStencilState(): void;

        /**
         * Sets alpha constants used by some alpha blending modes
         * @param r defines the red component
         * @param g defines the green component
         * @param b defines the blue component
         * @param a defines the alpha component
         */
        setAlphaConstants(r: number, g: number, b: number, a: number): void;

        /**
         * Gets the current alpha mode
         * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/advanced/transparent_rendering
         * @returns the current alpha mode
         */
        getAlphaMode(): number;

        /**
         * Gets the current alpha equation.
         * @returns the current alpha equation
         */
        getAlphaEquation(): number;
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

AbstractEngine.prototype.getStencilBuffer = function (): boolean {
    return this._stencilState.stencilTest;
};

AbstractEngine.prototype.setStencilBuffer = function (enable: boolean): void {
    this._stencilState.stencilTest = enable;
};

AbstractEngine.prototype.getStencilMask = function (): number {
    return this._stencilState.stencilMask;
};

AbstractEngine.prototype.setStencilMask = function (mask: number): void {
    this._stencilState.stencilMask = mask;
};

AbstractEngine.prototype.getStencilFunction = function (): number {
    return this._stencilState.stencilFunc;
};

AbstractEngine.prototype.getStencilFunctionReference = function (): number {
    return this._stencilState.stencilFuncRef;
};

AbstractEngine.prototype.getStencilFunctionMask = function (): number {
    return this._stencilState.stencilFuncMask;
};

AbstractEngine.prototype.setStencilFunction = function (stencilFunc: number) {
    this._stencilState.stencilFunc = stencilFunc;
};

AbstractEngine.prototype.setStencilFunctionReference = function (reference: number): void {
    this._stencilState.stencilFuncRef = reference;
};

AbstractEngine.prototype.setStencilFunctionMask = function (mask: number): void {
    this._stencilState.stencilFuncMask = mask;
};

AbstractEngine.prototype.getStencilOperationFail = function (): number {
    return this._stencilState.stencilOpStencilFail;
};

AbstractEngine.prototype.getStencilOperationDepthFail = function (): number {
    return this._stencilState.stencilOpDepthFail;
};

AbstractEngine.prototype.getStencilOperationPass = function (): number {
    return this._stencilState.stencilOpStencilDepthPass;
};

AbstractEngine.prototype.setStencilOperationFail = function (operation: number): void {
    this._stencilState.stencilOpStencilFail = operation;
};

AbstractEngine.prototype.setStencilOperationDepthFail = function (operation: number): void {
    this._stencilState.stencilOpDepthFail = operation;
};

AbstractEngine.prototype.setStencilOperationPass = function (operation: number): void {
    this._stencilState.stencilOpStencilDepthPass = operation;
};

AbstractEngine.prototype.cacheStencilState = function (): void {
    this._cachedStencilBuffer = this.getStencilBuffer();
    this._cachedStencilFunction = this.getStencilFunction();
    this._cachedStencilMask = this.getStencilMask();
    this._cachedStencilOperationPass = this.getStencilOperationPass();
    this._cachedStencilOperationFail = this.getStencilOperationFail();
    this._cachedStencilOperationDepthFail = this.getStencilOperationDepthFail();
    this._cachedStencilReference = this.getStencilFunctionReference();
};

AbstractEngine.prototype.restoreStencilState = function (): void {
    this.setStencilFunction(this._cachedStencilFunction);
    this.setStencilMask(this._cachedStencilMask);
    this.setStencilBuffer(this._cachedStencilBuffer);
    this.setStencilOperationPass(this._cachedStencilOperationPass);
    this.setStencilOperationFail(this._cachedStencilOperationFail);
    this.setStencilOperationDepthFail(this._cachedStencilOperationDepthFail);
    this.setStencilFunctionReference(this._cachedStencilReference);
};

AbstractEngine.prototype.setAlphaConstants = function (r: number, g: number, b: number, a: number): void {
    this._alphaState.setAlphaBlendConstants(r, g, b, a);
};

AbstractEngine.prototype.getAlphaMode = function (): number {
    return this._alphaMode;
};

AbstractEngine.prototype.getAlphaEquation = function (): number {
    return this._alphaEquation;
};
