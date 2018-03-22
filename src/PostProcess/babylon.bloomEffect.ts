module BABYLON {
    /**
     * The bloom effect spreads bright areas of an image to simulate artifacts seen in cameras
     */
    export class BloomEffect extends PostProcessRenderEffect{
        /**
         * Internal
         */
        public _effects: Array<PostProcess> = [];

        /**
         * Internal
         */
        public _downscale:ExtractHighlightsPostProcess;
        private _blurX:BlurPostProcess;
        private _blurY:BlurPostProcess;
        private _merge:Nullable<DefaultPipelineMergeMergePostProcess>;

        /**
         * The luminance threshold to find bright areas of the image to bloom. 
         */
        public get threshold():number{
            return this._downscale.threshold;
        }
        public set threshold(value: number){
            this._downscale.threshold = value;
        }

        /**
         * Specifies the size of the bloom blur kernel, relative to the final output size
         */
        public get kernel():number{
            return this._blurX.kernel / this.bloomScale;
        }
        public set kernel(value: number){
            this._blurX.kernel = value * this.bloomScale;
            this._blurY.kernel = value * this.bloomScale;
        }
        
        /**
         * Creates a new instance of @see BloomEffect
         * @param scene The scene the effect belongs to.
         * @param bloomScale The ratio of the blur texture to the input texture that should be used to compute the bloom.
         * @param bloomKernel The size of the kernel to be used when applying the blur.
         * @param pipelineTextureType The type of texture to be used when performing the post processing.
         * @param performMerge If the finalization merge should be performed by this effect.
         * @param blockCompilation If compilation of the shader should not be done in the constructor. The updateEffect method can be used to compile the shader at a later time. (default: false)
         */
        constructor(scene: Scene, private bloomScale:number, bloomKernel:number, pipelineTextureType = 0, performMerge = true, blockCompilation = false) {
            super(scene.getEngine(), "bloom", ()=>{
                return this._effects;
            }, true);
            this._downscale = new ExtractHighlightsPostProcess("highlights", 1.0, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, pipelineTextureType, blockCompilation);

            this._blurX = new BlurPostProcess("horizontal blur", new Vector2(1.0, 0), 10.0, bloomScale, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, pipelineTextureType, undefined, blockCompilation);
            this._blurX.alwaysForcePOT = true;
            this._blurX.autoClear = false;

            this._blurY = new BlurPostProcess("vertical blur", new Vector2(0, 1.0), 10.0, bloomScale, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, pipelineTextureType, undefined, blockCompilation);
            this._blurY.alwaysForcePOT = true;
            this._blurY.autoClear = false;

            this.kernel = bloomKernel;

            this._effects = [this._downscale, this._blurY, this._blurX];

            if(performMerge){
                this._merge = new DefaultPipelineMergeMergePostProcess("defaultPipelineMerge", {originalFromInput: this._blurX, bloom: {blurred: this._blurY, weight: 0}}, 1, null, BABYLON.Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, pipelineTextureType, blockCompilation);
                this._merge.autoClear = false;
                this._effects.push(this._merge);
            }
        }

        /**
         * Disposes each of the internal effects for a given camera.
         * @param camera The camera to dispose the effect on.
         */
        public disposeEffects(camera:Camera){
            for(var effect in this._effects){
                this._effects[effect].dispose(camera);
            }
        }
        
        /**
         * Internal
         */
        public _updateEffects(){
            for(var effect in this._effects){
                this._effects[effect].updateEffect();
            }
        }

        /**
         * Internal
         * @returns if all the contained post processes are ready.
         */
        public _isReady(){
            for(var effect in this._effects){
                if(!this._effects[effect].isReady()){
                    return false;
                }
            }
            return true;
        }
    }
}