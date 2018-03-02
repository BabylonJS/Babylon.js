module BABYLON {
    /**
     * The CircleOfConfusionPostProcess computes the circle of confusion value for each pixel given required lens parameters. See https://en.wikipedia.org/wiki/Circle_of_confusion
     */
    export class CircleOfConfusionPostProcess extends PostProcess {
        /**
         * Max lens size in scene units/1000 (eg. millimeter). Standard cameras are 50mm. (default: 50) The diamater of the resulting aperture can be computed by lensSize/fStop.
         */
        public lensSize = 50
        /**
         * F-Stop of the effect's camera. The diamater of the resulting aperture can be computed by lensSize/fStop. (default: 1.4)
         */
        public fStop = 1.4;
        /**
         * Distance away from the camera to focus on in scene units/1000 (eg. millimeter). (default: 2000)
         */
        public focusDistance = 2000;
        /**
         * Focal length of the effect's camera in scene units/1000 (eg. millimeter). (default: 50)
         */
        public focalLength = 50;
        
        private _depthTexture:Nullable<RenderTargetTexture> = null;
        /**
         * Creates a new instance of @see CircleOfConfusionPostProcess
         * @param name The name of the effect.
         * @param depthTexture The depth texture of the scene to compute the circle of confusion.
         * @param options The required width/height ratio to downsize to before computing the render pass.
         * @param camera The camera to apply the render pass to.
         * @param samplingMode The sampling mode to be used when computing the pass. (default: 0)
         * @param engine The engine which the post process will be applied. (default: current engine)
         * @param reusable If the post process can be reused on the same frame. (default: false)
         * @param textureType Type of textures used when performing the post process. (default: 0)
         */
        constructor(name: string, depthTexture: Nullable<RenderTargetTexture>, options: number | PostProcessOptions, camera: Nullable<Camera>, samplingMode?: number, engine?: Engine, reusable?: boolean, textureType: number = Engine.TEXTURETYPE_UNSIGNED_INT) {
            super(name, "circleOfConfusion", ["cameraMinMaxZ", "focusDistance", "cocPrecalculation"], ["depthSampler"], options, camera, samplingMode, engine, reusable, null, textureType);
            this._depthTexture = depthTexture;
            this.onApplyObservable.add((effect: Effect) => {
                if(!this._depthTexture){
                    BABYLON.Tools.Warn("No depth texture set on CircleOfConfusionPostProcess")
                    return;
                }
                effect.setTexture("depthSampler", this._depthTexture);
                
                // Circle of confusion calculation, See https://developer.nvidia.com/gpugems/GPUGems/gpugems_ch23.html
                var aperture = this.lensSize/this.fStop;
                var cocPrecalculation = ((aperture * this.focalLength)/((this.focusDistance - this.focalLength)));// * ((this.focusDistance - pixelDistance)/pixelDistance) [This part is done in shader]
                
                effect.setFloat('focusDistance', this.focusDistance);
                effect.setFloat('cocPrecalculation', cocPrecalculation);
                effect.setFloat2('cameraMinMaxZ', this._depthTexture.activeCamera!.minZ, this._depthTexture.activeCamera!.maxZ);
            })
        }

        public set depthTexture(value: RenderTargetTexture){
            this._depthTexture = value;
        }
    }
}