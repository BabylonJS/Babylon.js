module BABYLON {
    /**
     * The SharpenPostProcess applies a sharpen kernel to every pixel
     * See http://en.wikipedia.org/wiki/Kernel_(image_processing)
     */
    export class SharpenPostProcess extends PostProcess{
        /**
         * How much of the original color should be applied. Setting this to 0 will display edge detection. (default: 1)
         */
        public colorAmount: number = 1.0;
        /**
         * How much sharpness should be applied (default: 0.3)
         */
        public edgeAmount: number = 0.3;
        /**
         * Creates a new instance ConvolutionPostProcess
         * @param name The name of the effect.
         * @param options The required width/height ratio to downsize to before computing the render pass.
         * @param camera The camera to apply the render pass to.
         * @param samplingMode The sampling mode to be used when computing the pass. (default: 0)
         * @param engine The engine which the post process will be applied. (default: current engine)
         * @param reusable If the post process can be reused on the same frame. (default: false)
         * @param textureType Type of textures used when performing the post process. (default: 0)
         * @param blockCompilation If compilation of the shader should not be done in the constructor. The updateEffect method can be used to compile the shader at a later time. (default: false)
         */
        constructor(name: string, options: number | PostProcessOptions, camera: Nullable<Camera>, samplingMode?: number, engine?: Engine, reusable?: boolean, textureType: number = Engine.TEXTURETYPE_UNSIGNED_INT, blockCompilation = false) {
            super(name, "sharpen", ["sharpnessAmounts", "screenSize"], null, options, camera, samplingMode, engine, reusable, null, textureType, undefined, null, blockCompilation);

            this.onApply = (effect: Effect) => {
                effect.setFloat2("screenSize", this.width, this.height);
                effect.setFloat2("sharpnessAmounts", this.edgeAmount, this.colorAmount);
            };
        }
    }
}
