module BABYLON {
    /**
     * The bloom effect spreads bright areas of an image to simulate artifacts seen in cameras
     */
    export class BloomEffect extends PostProcessRenderEffect{
        private _effects: Array<PostProcess> = [];
        public _merge:DepthOfFieldMergePostProcess;

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
            
            var blurX = new BlurPostProcess("horizontal blur", new Vector2(1.0, 0), 10.0, bloomScale, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, pipelineTextureType);
            blurX.alwaysForcePOT = true;
            blurX.onActivateObservable.add(() => {
                let dw = blurX.width / scene.getEngine().getRenderWidth(true);
                blurX.kernel = bloomKernel * dw;
            });

            var blurY = new BlurPostProcess("vertical blur", new Vector2(0, 1.0), 10.0, bloomScale, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, pipelineTextureType);
            blurY.alwaysForcePOT = true;
            blurY.autoClear = false;
            blurY.onActivateObservable.add(() => {
                let dh = blurY.height / scene.getEngine().getRenderHeight(true);
                blurY.kernel = bloomKernel * dh;
            });
            
            this._merge = new DepthOfFieldMergePostProcess("depthOfFieldMerge", {originalFromInput: blurX, bloom: {blurred: blurY, weight: 0}}, 1, null, BABYLON.Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, pipelineTextureType, blockCompilation);
            this._merge.autoClear = false;

            this._effects = [blurX, blurY, this._merge]
        }
    }
}