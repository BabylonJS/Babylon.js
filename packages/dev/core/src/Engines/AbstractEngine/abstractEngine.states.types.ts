import { type Nullable } from "../../types";
declare module "../../Engines/abstractEngine.pure" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface AbstractEngine {
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
         * @param targetIndex defines the index of the target to get the alpha mode for (default is 0)
         * @returns the current alpha mode
         */
        getAlphaMode(targetIndex?: number): number;

        /**
         * Gets the current alpha equation.
         * @param targetIndex defines the index of the target to get the alpha equation for (default is 0)
         * @returns the current alpha equation
         */
        getAlphaEquation(targetIndex?: number): number;
    }
}
