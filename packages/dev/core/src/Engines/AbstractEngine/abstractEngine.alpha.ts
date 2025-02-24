import { AbstractEngine } from "../abstractEngine";
import { Constants } from "../constants";

declare module "../abstractEngine" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface AbstractEngine {
        /**
         * Sets the current alpha equation
         * @param equation defines the equation to use (one of the Engine.ALPHA_EQUATION_XXX)
         */
        setAlphaEquation(equation: number): void;
    }
}

AbstractEngine.prototype.setAlphaEquation = function (equation: number): void {
    if (this._alphaEquation === equation) {
        return;
    }

    switch (equation) {
        case Constants.ALPHA_EQUATION_ADD:
            this._alphaState.setAlphaEquationParameters(Constants.GL_ALPHA_EQUATION_ADD, Constants.GL_ALPHA_EQUATION_ADD);
            break;
        case Constants.ALPHA_EQUATION_SUBSTRACT:
            this._alphaState.setAlphaEquationParameters(Constants.GL_ALPHA_EQUATION_SUBTRACT, Constants.GL_ALPHA_EQUATION_SUBTRACT);
            break;
        case Constants.ALPHA_EQUATION_REVERSE_SUBTRACT:
            this._alphaState.setAlphaEquationParameters(Constants.GL_ALPHA_EQUATION_REVERSE_SUBTRACT, Constants.GL_ALPHA_EQUATION_REVERSE_SUBTRACT);
            break;
        case Constants.ALPHA_EQUATION_MAX:
            this._alphaState.setAlphaEquationParameters(Constants.GL_ALPHA_EQUATION_MAX, Constants.GL_ALPHA_EQUATION_MAX);
            break;
        case Constants.ALPHA_EQUATION_MIN:
            this._alphaState.setAlphaEquationParameters(Constants.GL_ALPHA_EQUATION_MIN, Constants.GL_ALPHA_EQUATION_MIN);
            break;
        case Constants.ALPHA_EQUATION_DARKEN:
            this._alphaState.setAlphaEquationParameters(Constants.GL_ALPHA_EQUATION_MIN, Constants.GL_ALPHA_EQUATION_ADD);
            break;
    }
    this._alphaEquation = equation;
};
