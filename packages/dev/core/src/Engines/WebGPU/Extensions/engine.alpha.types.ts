export {};

declare module "../../abstractEngine.pure" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface AbstractEngine {
        /**
         * Sets the current alpha mode
         * @param mode defines the mode to use (one of the Engine.ALPHA_XXX)
         * @param noDepthWriteChange defines if depth writing state should remains unchanged (false by default)
         * @param targetIndex defines the index of the target to set the alpha mode for (default is 0)
         * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/advanced/transparent_rendering
         */
        setAlphaMode(mode: number, noDepthWriteChange?: boolean, targetIndex?: number): void;
    }
}
