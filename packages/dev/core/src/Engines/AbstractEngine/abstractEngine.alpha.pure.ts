import { Constants } from "../constants";
import { AbstractEngine } from "../abstractEngine.pure";
/** This file must only contain pure code and pure imports */

let _Registered = false;
/**
 * Register side effects for abstractEngineAlpha.
 * Safe to call multiple times; only the first call has an effect.
 */
export function RegisterAbstractEngineAlpha(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    AbstractEngine.prototype.setAlphaEquation = function (equation: number, targetIndex: number = 0): void {
        if (this._alphaEquation[targetIndex] === equation) {
            return;
        }

        switch (equation) {
            case Constants.ALPHA_EQUATION_ADD:
                this._alphaState.setAlphaEquationParameters(Constants.GL_ALPHA_EQUATION_ADD, Constants.GL_ALPHA_EQUATION_ADD, targetIndex);
                break;
            case Constants.ALPHA_EQUATION_SUBSTRACT:
                this._alphaState.setAlphaEquationParameters(Constants.GL_ALPHA_EQUATION_SUBTRACT, Constants.GL_ALPHA_EQUATION_SUBTRACT, targetIndex);
                break;
            case Constants.ALPHA_EQUATION_REVERSE_SUBTRACT:
                this._alphaState.setAlphaEquationParameters(Constants.GL_ALPHA_EQUATION_REVERSE_SUBTRACT, Constants.GL_ALPHA_EQUATION_REVERSE_SUBTRACT, targetIndex);
                break;
            case Constants.ALPHA_EQUATION_MAX:
                this._alphaState.setAlphaEquationParameters(Constants.GL_ALPHA_EQUATION_MAX, Constants.GL_ALPHA_EQUATION_MAX, targetIndex);
                break;
            case Constants.ALPHA_EQUATION_MIN:
                this._alphaState.setAlphaEquationParameters(Constants.GL_ALPHA_EQUATION_MIN, Constants.GL_ALPHA_EQUATION_MIN, targetIndex);
                break;
            case Constants.ALPHA_EQUATION_DARKEN:
                this._alphaState.setAlphaEquationParameters(Constants.GL_ALPHA_EQUATION_MIN, Constants.GL_ALPHA_EQUATION_ADD, targetIndex);
                break;
        }
        this._alphaEquation[targetIndex] = equation;
    };
}
