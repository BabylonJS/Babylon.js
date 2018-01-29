module BABYLON {
    
    /**
     * The depth of field effect applies a blur to objects that are closer or further from where the camera is focusing.
     */
    export class DepthOfFieldEffect extends PostProcessRenderEffect{
        private _depthOfFieldPass: PassPostProcess;
        private _circleOfConfusion: CircleOfConfusionPostProcess;
        private _depthOfFieldBlurX: DepthOfFieldBlurPostProcess;
        private _depthOfFieldBlurY: DepthOfFieldBlurPostProcess;
        private _depthOfFieldMerge: DepthOfFieldMergePostProcess;

        /**
         * The size of the kernel to be used for the blur
         */
        public set kernelSize(value: number){
            this._depthOfFieldBlurX.kernel = value;
            this._depthOfFieldBlurY.kernel = value;
        }
        public get kernelSize(){
            return this._depthOfFieldBlurX.kernel;
        }
        /**
         * The focal the length of the camera used in the effect
         */
        public set focalLength(value: number){
            this._circleOfConfusion.focalLength = value;
        }
        public get focalLength(){
            return this._circleOfConfusion.focalLength;
        }
        /**
         * F-Stop of the effect's camera. The diamater of the resulting aperture can be computed by lensSize/fStop. (default: 1.4)
         */
        public set fStop(value: number){
            this._circleOfConfusion.fStop = value;
        }
        public get fStop(){
            return this._circleOfConfusion.fStop;
        }
        /**
         * Distance away from the camera to focus on in scene units/1000 (eg. millimeter). (default: 2000)
         */
        public set focusDistance(value: number){
            this._circleOfConfusion.focusDistance = value;
        }
        public get focusDistance(){
            return this._circleOfConfusion.focusDistance;
        }
        /**
         * Max lens size in scene units/1000 (eg. millimeter). Standard cameras are 50mm. (default: 50) The diamater of the resulting aperture can be computed by lensSize/fStop.
         */
        public set lensSize(value: number){
            this._circleOfConfusion.lensSize = value;
        }
        public get lensSize(){
            return this._circleOfConfusion.lensSize;
        }

        /**
         * Creates a new instance of @see DepthOfFieldEffect
         * @param scene The scene the effect belongs to.
         * @param pipelineTextureType The type of texture to be used when performing the post processing.
         */
        constructor(scene: Scene, pipelineTextureType = 0) {
            super(scene.getEngine(), "depth of field", ()=>{return [this._circleOfConfusion, this._depthOfFieldPass, this._depthOfFieldBlurY, this._depthOfFieldBlurX, this._depthOfFieldMerge]}, true);
            // Enable and get current depth map
            var depthMap = scene.enableDepthRenderer().getDepthMap();
            // Circle of confusion value for each pixel is used to determine how much to blur that pixel
            this._circleOfConfusion = new BABYLON.CircleOfConfusionPostProcess("circleOfConfusion", scene, depthMap, 1, null, BABYLON.Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, pipelineTextureType);
            // Capture circle of confusion texture
            this._depthOfFieldPass = new PassPostProcess("depthOfFieldPass", 1.0, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, pipelineTextureType);
            // Blur the image but do not blur on sharp far to near distance changes to avoid bleeding artifacts 
            // See section 2.6.2 http://fileadmin.cs.lth.se/cs/education/edan35/lectures/12dof.pdf
            this._depthOfFieldBlurY = new DepthOfFieldBlurPostProcess("verticle blur", scene, new Vector2(0, 1.0), 15, 1.0, null, depthMap, this._circleOfConfusion, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, pipelineTextureType);
            this._depthOfFieldBlurX = new DepthOfFieldBlurPostProcess("horizontal blur", scene, new Vector2(1.0, 0), 15, 1.0, null,  depthMap, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, pipelineTextureType);
            // Merge blurred images with original image based on circleOfConfusion
            this._depthOfFieldMerge = new DepthOfFieldMergePostProcess("depthOfFieldMerge", this._circleOfConfusion, this._depthOfFieldPass, 1, null, BABYLON.Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, pipelineTextureType);
        }

        /**
         * Disposes each of the internal effects for a given camera.
         * @param camera The camera to dispose the effect on.
         */
        public disposeEffects(camera:Camera){
            this._depthOfFieldPass.dispose(camera);
            this._circleOfConfusion.dispose(camera);
            this._depthOfFieldBlurX.dispose(camera);
            this._depthOfFieldBlurY.dispose(camera);
            this._depthOfFieldMerge.dispose(camera);
        }
    }
}