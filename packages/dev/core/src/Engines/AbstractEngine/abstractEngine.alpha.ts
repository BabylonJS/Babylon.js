import { AbstractEngine } from "../abstractEngine";
import {
    ALPHA_EQUATION_ADD,
    GL_ALPHA_EQUATION_ADD,
    ALPHA_EQUATION_SUBSTRACT,
    GL_ALPHA_EQUATION_SUBTRACT,
    ALPHA_EQUATION_REVERSE_SUBTRACT,
    GL_ALPHA_EQUATION_REVERSE_SUBTRACT,
    ALPHA_EQUATION_MAX,
    GL_ALPHA_EQUATION_MAX,
    ALPHA_EQUATION_MIN,
    GL_ALPHA_EQUATION_MIN,
    ALPHA_EQUATION_DARKEN,
} from "../constants";

declare module "../abstractEngine" {
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
        case ALPHA_EQUATION_ADD:
            this._alphaState.setAlphaEquationParameters(GL_ALPHA_EQUATION_ADD, GL_ALPHA_EQUATION_ADD);
            break;
        case ALPHA_EQUATION_SUBSTRACT:
            this._alphaState.setAlphaEquationParameters(GL_ALPHA_EQUATION_SUBTRACT, GL_ALPHA_EQUATION_SUBTRACT);
            break;
        case ALPHA_EQUATION_REVERSE_SUBTRACT:
            this._alphaState.setAlphaEquationParameters(GL_ALPHA_EQUATION_REVERSE_SUBTRACT, GL_ALPHA_EQUATION_REVERSE_SUBTRACT);
            break;
        case ALPHA_EQUATION_MAX:
            this._alphaState.setAlphaEquationParameters(GL_ALPHA_EQUATION_MAX, GL_ALPHA_EQUATION_MAX);
            break;
        case ALPHA_EQUATION_MIN:
            this._alphaState.setAlphaEquationParameters(GL_ALPHA_EQUATION_MIN, GL_ALPHA_EQUATION_MIN);
            break;
        case ALPHA_EQUATION_DARKEN:
            this._alphaState.setAlphaEquationParameters(GL_ALPHA_EQUATION_MIN, GL_ALPHA_EQUATION_ADD);
            break;
    }
    this._alphaEquation = equation;
};
