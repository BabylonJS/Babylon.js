import { AbstractEngine } from "../abstractEngine.pure";
/** This file must only contain pure code and pure imports */

let _registered = false;
export function registerAbstractEngineStencil(): void {
    if (_registered) {
        return;
    }
    _registered = true;

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
}
