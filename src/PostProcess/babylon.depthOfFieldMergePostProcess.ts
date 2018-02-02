module BABYLON {
    /**
     * The DepthOfFieldMergePostProcess merges blurred images with the original based on the values of the circle of confusion.
     */
    export class DepthOfFieldMergePostProcess extends PostProcess {
        /**
         * Creates a new instance of @see CircleOfConfusionPostProcess
         * @param name The name of the effect.
         * @param original The non-blurred image to be modified
         * @param circleOfConfusion The circle of confusion post process that will determine how blurred each pixel should become.
         * @param blurSteps Incrimental bluring post processes.
         * @param options The required width/height ratio to downsize to before computing the render pass.
         * @param camera The camera to apply the render pass to.
         * @param samplingMode The sampling mode to be used when computing the pass. (default: 0)
         * @param engine The engine which the post process will be applied. (default: current engine)
         * @param reusable If the post process can be reused on the same frame. (default: false)
         * @param textureType Type of textures used when performing the post process. (default: 0)
         */
        constructor(name: string, original: PostProcess, circleOfConfusion: PostProcess, blurSteps: Array<PostProcess>, options: number | PostProcessOptions, camera: Nullable<Camera>, samplingMode?: number, engine?: Engine, reusable?: boolean, textureType: number = Engine.TEXTURETYPE_UNSIGNED_INT) {
            super(name, "depthOfFieldMerge", [], ["circleOfConfusionSampler", "originalSampler", "blurStep1", "blurStep2"], options, camera, samplingMode, engine, reusable, "#define BLUR_LEVEL "+blurSteps.length+"\n", textureType);
            this.onApplyObservable.add((effect: Effect) => {
                effect.setTextureFromPostProcess("circleOfConfusionSampler", circleOfConfusion);
                effect.setTextureFromPostProcess("originalSampler", original);
                blurSteps.forEach((step,index)=>{
                    effect.setTextureFromPostProcess("blurStep"+(index+1), step);
                });
            });
        }
    }
}