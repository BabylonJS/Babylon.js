module BABYLON {
    /**
     * Extracts highlights from the image
     * @see https://doc.babylonjs.com/how_to/how_to_use_postprocesses
     */
    export class HighlightsPostProcess extends PostProcess {
        /**
         * Extracts highlights from the image
         * @see https://doc.babylonjs.com/how_to/how_to_use_postprocesses
         * @param name The name of the effect.
         * @param options The required width/height ratio to downsize to before computing the render pass.
         * @param camera The camera to apply the render pass to.
         * @param samplingMode The sampling mode to be used when computing the pass. (default: 0)
         * @param engine The engine which the post process will be applied. (default: current engine)
         * @param reusable If the post process can be reused on the same frame. (default: false)
         * @param textureType Type of texture for the post process (default: Engine.TEXTURETYPE_UNSIGNED_INT)
         */
        constructor(name: string, options: number | PostProcessOptions, camera: Nullable<Camera>, samplingMode?: number, engine?: Engine, reusable?: boolean, textureType: number = Engine.TEXTURETYPE_UNSIGNED_INT) {
            super(name, "highlights", null, null, options, camera, samplingMode, engine, reusable, null, textureType);
        }
    }
}