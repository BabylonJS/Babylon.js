module BABYLON {
    /**
     * The bloom effect spreads bright areas of an image to simulate artifacts seen in cameras
     */
    export class BloomEffect extends PostProcessRenderEffect{
        private _effects: Array<PostProcess> = [];
        private blurX:BlurPostProcess;
        private blurY:BlurPostProcess;
        
        /**
         * Internal
         */
        public _merge:DefaultPipelineMergeMergePostProcess;

        /**
         * Creates a new instance of @see BloomEffect
         * @param scene The scene the effect belongs to.
         * @param bloomScale The ratio of the blur texture to the input texture that should be used to compute the bloom.
         * @param bloomKernel The size of the kernel to be used when applying the blur.
         * @param pipelineTextureType The type of texture to be used when performing the post processing.
         * @param blockCompilation If compilation of the shader should not be done in the constructor. The updateEffect method can be used to compile the shader at a later time. (default: false)
         */
        constructor(scene: Scene, bloomScale:number, bloomKernel:number, pipelineTextureType = 0, blockCompilation = false) {
            super(scene.getEngine(), "depth of field", ()=>{
                return this._effects;
            }, true);
            
            this.blurX = new BlurPostProcess("horizontal blur", new Vector2(1.0, 0), 10.0, bloomScale, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, pipelineTextureType, undefined, blockCompilation);
            this.blurX.alwaysForcePOT = true;
            this.blurX.onActivateObservable.add(() => {
                let dw = this.blurX.width / scene.getEngine().getRenderWidth(true);
                this.blurX.kernel = bloomKernel * dw;
            });

            this.blurY = new BlurPostProcess("vertical blur", new Vector2(0, 1.0), 10.0, bloomScale, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, pipelineTextureType, undefined, blockCompilation);
            this.blurY.alwaysForcePOT = true;
            this.blurY.autoClear = false;
            this.blurY.onActivateObservable.add(() => {
                let dh = this.blurY.height / scene.getEngine().getRenderHeight(true);
                this.blurY.kernel = bloomKernel * dh;
            });
            
            this._merge = new DefaultPipelineMergeMergePostProcess("defaultPipelineMerge", {originalFromInput: this.blurX, bloom: {blurred: this.blurY, weight: 0}}, 1, null, BABYLON.Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, pipelineTextureType, blockCompilation);
            this._merge.autoClear = false;

            this._effects = [this.blurX, this.blurY, this._merge]
        }

        /**
         * Disposes each of the internal effects for a given camera.
         * @param camera The camera to dispose the effect on.
         */
        public disposeEffects(camera:Camera){
            this.blurX.dispose(camera);
            this.blurY.dispose(camera);
            this._merge.dispose(camera);
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