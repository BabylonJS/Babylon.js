module BABYLON {
    /**
     * Options to be set when merging outputs from the default pipeline.
     */
	export class DepthOfFieldMergePostProcessOptions {
        /**
         * The original image to merge on top of
         */
        public originalFromInput?: PostProcess;
        /**
         * Parameters to perform the merge of the depth of field effect
         */
        public depthOfField?: {
            circleOfConfusion: PostProcess;
            blurSteps: Array<PostProcess>;
        };
        /**
         * Parameters to perform the merge of bloom effect
         */
        public bloom?: {
            blurred: PostProcess;
            weight: number;
        };
    }

    /**
     * The DepthOfFieldMergePostProcess merges blurred images with the original based on the values of the circle of confusion.
     */
    export class DepthOfFieldMergePostProcess extends PostProcess {
        /**
         * Internal, optins for the merge post process
         */
        public _mergeOptions:DepthOfFieldMergePostProcessOptions;

        /**
         * Creates a new instance of @see CircleOfConfusionPostProcess
         * @param name The name of the effect.
         * @param mergeOptions Options to be set when merging outputs from the default pipeline.
         * @param options The required width/height ratio to downsize to before computing the render pass.
         * @param camera The camera to apply the render pass to.
         * @param samplingMode The sampling mode to be used when computing the pass. (default: 0)
         * @param engine The engine which the post process will be applied. (default: current engine)
         * @param reusable If the post process can be reused on the same frame. (default: false)
         * @param textureType Type of textures used when performing the post process. (default: 0)
         * @param blockCompilation If compilation of the shader should not be done in the constructor. The updateEffect method can be used to compile the shader at a later time. (default: false)
         */
        constructor(name: string, mergeOptions: DepthOfFieldMergePostProcessOptions, options: number | PostProcessOptions, camera: Nullable<Camera>, samplingMode?: number, engine?: Engine, reusable?: boolean, textureType: number = Engine.TEXTURETYPE_UNSIGNED_INT, blockCompilation = false) {
            super(name, "depthOfFieldMerge", ["bloomWeight"], ["circleOfConfusionSampler", "blurStep0", "blurStep1", "blurStep2", "bloomBlur"], options, camera, samplingMode, engine, reusable, null, textureType, undefined, null, true);
            this._mergeOptions = mergeOptions;
            this.onApplyObservable.add((effect: Effect) => {
                if(mergeOptions.originalFromInput){
                    effect.setTextureFromPostProcess("textureSampler", mergeOptions.originalFromInput);
                }
                if(mergeOptions.depthOfField){
                    effect.setTextureFromPostProcessOutput("circleOfConfusionSampler", mergeOptions.depthOfField.circleOfConfusion);
                    mergeOptions.depthOfField.blurSteps.forEach((step,index)=>{
                        effect.setTextureFromPostProcessOutput("blurStep"+(mergeOptions.depthOfField!.blurSteps.length-index-1), step);
                    });
                }
                if(mergeOptions.bloom){
                    effect.setTextureFromPostProcessOutput("bloomBlur", mergeOptions.bloom.blurred);
                    effect.setFloat("bloomWeight", mergeOptions.bloom.weight);
                }        
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
            if(!defines){
                defines = "";
                if(this._mergeOptions.depthOfField){
                    defines += "#define DOF 1\n";
                    defines += "#define BLUR_LEVEL "+(this._mergeOptions.depthOfField.blurSteps.length-1)+"\n";
                }
                if(this._mergeOptions.bloom){
                    defines += "#define BLOOM 1\n";
                }
            }
            super.updateEffect(defines, uniforms, samplers, indexParameters, onCompiled, onError);
        }
    }
}