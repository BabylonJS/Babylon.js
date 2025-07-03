import { AbstractEngine } from "../abstractEngine";

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
         * Gets the current stencil operation when stencil passes
         * @returns a number defining stencil operation to use when stencil passes
         */
        getStencilOperationPass(): number;

        /**
         * Gets the current back stencil operation when stencil passes
         * @returns a number defining back stencil operation to use when stencil passes
         */
        getStencilBackOperationPass(): number;

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
         * Gets the current back stencil function
         * @returns a number defining the back stencil function to use
         */
        getStencilBackFunction(): number;

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
         * Sets the current back stencil function
         * @param stencilFunc defines the new back stencil function to use
         */
        setStencilBackFunction(stencilFunc: number): void;

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
         * Gets the current back stencil operation when stencil fails
         * @returns a number defining back stencil operation to use when stencil fails
         */
        getStencilBackOperationFail(): number;

        /**
         * Gets the current stencil operation when depth fails
         * @returns a number defining stencil operation to use when depth fails
         */
        getStencilOperationDepthFail(): number;

        /**
         * Gets the current back stencil operation when depth fails
         * @returns a number defining back stencil operation to use when depth fails
         */
        getStencilBackOperationDepthFail(): number;

        /**
         * Sets the stencil operation to use when stencil fails
         * @param operation defines the stencil operation to use when stencil fails
         */
        setStencilOperationFail(operation: number): void;

        /**
         * Sets the back stencil operation to use when stencil fails
         * @param operation defines the back stencil operation to use when stencil fails
         */
        setStencilBackOperationFail(operation: number): void;

        /**
         * Sets the stencil operation to use when depth fails
         * @param operation defines the stencil operation to use when depth fails
         */
        setStencilOperationDepthFail(operation: number): void;

        /**
         * Sets the back stencil operation to use when depth fails
         * @param operation defines the back stencil operation to use when depth fails
         */
        setStencilBackOperationDepthFail(operation: number): void;

        /**
         * Sets the stencil operation to use when stencil passes
         * @param operation defines the stencil operation to use when stencil passes
         */
        setStencilOperationPass(operation: number): void;

        /**
         * Sets the back stencil operation to use when stencil passes
         * @param operation defines the back stencil operation to use when stencil passes
         */
        setStencilBackOperationPass(operation: number): void;

        /**
         * Caches the state of the stencil buffer
         */
        cacheStencilState(): void;

        /**
         * Restores the state of the stencil buffer
         */
        restoreStencilState(): void;
    }
}

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

AbstractEngine.prototype.getStencilBackFunction = function (): number {
    return this._stencilState.stencilBackFunc;
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

AbstractEngine.prototype.setStencilBackFunction = function (stencilFunc: number) {
    this._stencilState.stencilBackFunc = stencilFunc;
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

AbstractEngine.prototype.getStencilBackOperationFail = function (): number {
    return this._stencilState.stencilBackOpStencilFail;
};

AbstractEngine.prototype.getStencilOperationDepthFail = function (): number {
    return this._stencilState.stencilOpDepthFail;
};

AbstractEngine.prototype.getStencilBackOperationDepthFail = function (): number {
    return this._stencilState.stencilBackOpDepthFail;
};

AbstractEngine.prototype.getStencilOperationPass = function (): number {
    return this._stencilState.stencilOpStencilDepthPass;
};

AbstractEngine.prototype.getStencilBackOperationPass = function (): number {
    return this._stencilState.stencilBackOpStencilDepthPass;
};

AbstractEngine.prototype.setStencilOperationFail = function (operation: number): void {
    this._stencilState.stencilOpStencilFail = operation;
};

AbstractEngine.prototype.setStencilBackOperationFail = function (operation: number): void {
    this._stencilState.stencilBackOpStencilFail = operation;
};

AbstractEngine.prototype.setStencilOperationDepthFail = function (operation: number): void {
    this._stencilState.stencilOpDepthFail = operation;
};

AbstractEngine.prototype.setStencilBackOperationDepthFail = function (operation: number): void {
    this._stencilState.stencilBackOpDepthFail = operation;
};

AbstractEngine.prototype.setStencilOperationPass = function (operation: number): void {
    this._stencilState.stencilOpStencilDepthPass = operation;
};

AbstractEngine.prototype.setStencilBackOperationPass = function (operation: number): void {
    this._stencilState.stencilBackOpStencilDepthPass = operation;
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
