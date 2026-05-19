/** This file must only contain pure code and pure imports */

import { type Nullable } from "../../types";
import { Constants } from "../constants";
import { AbstractEngine } from "../abstractEngine.pure";

let _Registered = false;
/**
 * Register side effects for abstractEngineStates.
 * Safe to call multiple times; only the first call has an effect.
 */
export function RegisterAbstractEngineStates(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

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

    AbstractEngine.prototype.setAlphaConstants = function (r: number, g: number, b: number, a: number): void {
        this._alphaState.setAlphaBlendConstants(r, g, b, a);
    };

    AbstractEngine.prototype.getAlphaMode = function (targetIndex = 0): number {
        return this._alphaMode[targetIndex];
    };

    AbstractEngine.prototype.getAlphaEquation = function (targetIndex = 0): number {
        return this._alphaEquation[targetIndex];
    };
}
