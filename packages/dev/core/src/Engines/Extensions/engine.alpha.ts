import { getAlphaEquation, getAlphaMode, setAlphaConstants, setAlphaEquation, setAlphaMode } from "core/esm/Engines/WebGL/Extensions/alpha/alpha.webgl";
import { ThinEngine } from "../../Engines/thinEngine";

declare module "../../Engines/thinEngine" {
    export interface ThinEngine {
        /**
         * Sets alpha constants used by some alpha blending modes
         * @param r defines the red component
         * @param g defines the green component
         * @param b defines the blue component
         * @param a defines the alpha component
         */
        setAlphaConstants(r: number, g: number, b: number, a: number): void;

        /**
         * Sets the current alpha mode
         * @param mode defines the mode to use (one of the Engine.ALPHA_XXX)
         * @param noDepthWriteChange defines if depth writing state should remains unchanged (false by default)
         * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/advanced/transparent_rendering
         */
        setAlphaMode(mode: number, noDepthWriteChange?: boolean): void;

        /**
         * Gets the current alpha mode
         * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/advanced/transparent_rendering
         * @returns the current alpha mode
         */
        getAlphaMode(): number;

        /**
         * Sets the current alpha equation
         * @param equation defines the equation to use (one of the Engine.ALPHA_EQUATION_XXX)
         */
        setAlphaEquation(equation: number): void;

        /**
         * Gets the current alpha equation.
         * @returns the current alpha equation
         */
        getAlphaEquation(): number;
    }
}

ThinEngine.prototype.setAlphaConstants = function (r: number, g: number, b: number, a: number) {
    setAlphaConstants(this._engineState, r, g, b, a);
};

ThinEngine.prototype.setAlphaMode = function (mode: number, noDepthWriteChange: boolean = false): void {
    setAlphaMode(this._engineState, mode, noDepthWriteChange);
};

ThinEngine.prototype.getAlphaMode = function (): number {
    return getAlphaMode(this._engineState);
};

ThinEngine.prototype.setAlphaEquation = function (equation: number): void {
    setAlphaEquation(this._engineState, equation);
};

ThinEngine.prototype.getAlphaEquation = function () {
    return getAlphaEquation(this._engineState);
};
