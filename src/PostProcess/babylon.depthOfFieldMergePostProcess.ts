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
         * @param blockCompilation If compilation of the shader should not be done in the constructor. The updateEffect method can be used to compile the shader at a later time. (default: false)
         */
        constructor(name: string, original: PostProcess, circleOfConfusion: PostProcess, private blurSteps: Array<PostProcess>, options: number | PostProcessOptions, camera: Nullable<Camera>, samplingMode?: number, engine?: Engine, reusable?: boolean, textureType: number = Engine.TEXTURETYPE_UNSIGNED_INT, blockCompilation = false) {
            super(name, "depthOfFieldMerge", [], ["circleOfConfusionSampler", "originalSampler", "blurStep1", "blurStep2"], options, camera, samplingMode, engine, reusable, null, textureType, undefined, null, true);
            this.onApplyObservable.add((effect: Effect) => {
                effect.setTextureFromPostProcess("circleOfConfusionSampler", circleOfConfusion);
                effect.setTextureFromPostProcess("originalSampler", original);
                blurSteps.forEach((step,index)=>{
                    effect.setTextureFromPostProcess("blurStep"+(index+1), step);
                });
            });

            if(!blockCompilation){
                this.updateEffect();
            }
        }

        /**
         * Updates the effect with the current post process compile time values and recompiles the shader.
         * @param defines Define statements that should be added at the beginning of the shader. (default: null)
         * @param uniforms Set of uniform variables that will be passed to the shader. (default: null)
         * @param samplers Set of Texture2D variables that will be passed to the shader. (default: null)
         * @param indexParameters The index parameters to be used for babylons include syntax "#include<kernelBlurVaryingDeclaration>[0..varyingCount]". (default: undefined) See usage in babylon.blurPostProcess.ts and kernelBlur.vertex.fx
         * @param onCompiled Called when the shader has been compiled.
         * @param onError Called if there is an error when compiling a shader.
         */
        public updateEffect(defines: Nullable<string> = null, uniforms: Nullable<string[]> = null, samplers: Nullable<string[]> = null, indexParameters?: any,
            onCompiled?: (effect: Effect) => void, onError?: (effect: Effect, errors: string) => void) {
            super.updateEffect(defines ? defines : "#define BLUR_LEVEL "+this.blurSteps.length+"\n", uniforms, samplers, indexParameters, onCompiled, onError);
        }
    }
}