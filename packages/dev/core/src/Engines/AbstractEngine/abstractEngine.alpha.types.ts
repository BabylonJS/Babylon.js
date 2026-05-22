export {};

declare module "../abstractEngine.pure" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface AbstractEngine {
        /**
         * Sets the current alpha equation
         * @param equation defines the equation to use (one of the Engine.ALPHA_EQUATION_XXX)
         * @param targetIndex defines the index of the target to set the equation for (default is 0)
         */
        setAlphaEquation(equation: number, targetIndex?: number): void;
    }
}
