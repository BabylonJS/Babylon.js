import type { IBaseEnginePublic } from "../../engine.base.js";

export interface IAlphaEngineExtension {
    /**
     * Sets alpha constants used by some alpha blending modes
     * @param r defines the red component
     * @param g defines the green component
     * @param b defines the blue component
     * @param a defines the alpha component
     */
    setAlphaConstants(engineState: IBaseEnginePublic, r: number, g: number, b: number, a: number): void;

    /**
     * Sets the current alpha mode
     * @param mode defines the mode to use (one of the Engine.ALPHA_XXX)
     * @param noDepthWriteChange defines if depth writing state should remains unchanged (false by default)
     * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/advanced/transparent_rendering
     */
    setAlphaMode(engineState: IBaseEnginePublic, mode: number, noDepthWriteChange?: boolean): void;

    /**
     * Gets the current alpha mode
     * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/advanced/transparent_rendering
     * @returns the current alpha mode
     */
    getAlphaMode(engineState: IBaseEnginePublic): number;

    /**
     * Sets the current alpha equation
     * @param equation defines the equation to use (one of the Engine.ALPHA_EQUATION_XXX)
     */
    setAlphaEquation(engineState: IBaseEnginePublic, equation: number): void;

    /**
     * Gets the current alpha equation.
     * @returns the current alpha equation
     */
    getAlphaEquation(engineState: IBaseEnginePublic): number;
}
