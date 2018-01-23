module BABYLON {
    //TODO is there something this class should extend?. I dont think this fits as a postprocess or pipeline.
    export class DepthOfFieldEffect {
        private readonly DepthOfFieldPassPostProcessId: string = "DepthOfFieldPassPostProcessId";
        private readonly CircleOfConfusionPostProcessId: string = "CircleOfConfusionPostProcessEffect"; 
        private readonly DepthOfFieldBlurXPostProcessId: string = "DepthOfFieldBlurXPostProcessEffect";
        private readonly DepthOfFieldBlurYPostProcessId: string = "DepthOfFieldBlurYPostProcessEffect";
        private readonly DepthOfFieldMergePostProcessId: string = "DepthOfFieldMergePostProcessEffect";

        private depthOfFieldPass: PassPostProcess;
        private circleOfConfusion: CircleOfConfusionPostProcess;
        private depthOfFieldBlurX: BlurPostProcess;
        private depthOfFieldBlurY: BlurPostProcess;
        private depthOfFieldMerge: DepthOfFieldMergePostProcess;

        public set kernelSize(value: number){
            this.depthOfFieldBlurX.kernel = value;
            this.depthOfFieldBlurY.kernel = value;
        }
        public get kernelSize(){
            return this.depthOfFieldBlurX.kernel;
        }
        public set focalLength(value: number){
            this.circleOfConfusion.focalLength = value;
        }
        public get focalLength(){
            return this.circleOfConfusion.focalLength;
        }
        public set fStop(value: number){
            this.circleOfConfusion.fStop = value;
        }
        public get fStop(){
            return this.circleOfConfusion.fStop;
        }
        public set focusDistance(value: number){
            this.circleOfConfusion.focusDistance = value;
        }
        public get focusDistance(){
            return this.circleOfConfusion.focusDistance;
        }
        public set lensSize(value: number){
            this.circleOfConfusion.lensSize = value;
        }
        public get lensSize(){
            return this.circleOfConfusion.lensSize;
        }

        constructor(pipeline: PostProcessRenderPipeline, scene: Scene, camera:Camera, pipelineTextureType = 0) {
            // Enable and get current depth map
            var depthMap = scene.enableDepthRenderer().getDepthMap();
            // Circle of confusion value for each pixel is used to determine how much to blur that pixel
            this.circleOfConfusion = new BABYLON.CircleOfConfusionPostProcess("circleOfConfusion", depthMap, 1, null, BABYLON.Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), true, pipelineTextureType);
            pipeline.addEffect(new PostProcessRenderEffect(scene.getEngine(), this.CircleOfConfusionPostProcessId, () => { return this.circleOfConfusion; }, true));  
         
            // Capture circle of confusion texture
            this.depthOfFieldPass = new PassPostProcess("depthOfFieldPass", 1.0, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, pipelineTextureType);
            pipeline.addEffect(new PostProcessRenderEffect(scene.getEngine(), this.DepthOfFieldPassPostProcessId, () => { return this.depthOfFieldPass; }, true));

            // Blur the image but do not blur on sharp far to near distance changes to avoid bleeding artifacts 
            // See section 2.6.2 http://fileadmin.cs.lth.se/cs/education/edan35/lectures/12dof.pdf
            this.depthOfFieldBlurY = new BlurPostProcess("verticle blur", new Vector2(0, 1.0), 15, 1.0, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, pipelineTextureType, new DepthOfFieldBlurOptions(depthMap, this.circleOfConfusion));
            pipeline.addEffect(new PostProcessRenderEffect(scene.getEngine(), this.DepthOfFieldBlurYPostProcessId, () => { return this.depthOfFieldBlurY; }, true));
            this.depthOfFieldBlurX = new BlurPostProcess("horizontal blur", new Vector2(1.0, 0), 15, 1.0, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, pipelineTextureType, new DepthOfFieldBlurOptions(depthMap));
            pipeline.addEffect(new PostProcessRenderEffect(scene.getEngine(), this.DepthOfFieldBlurXPostProcessId, () => { return this.depthOfFieldBlurX; }, true));

            // Merge blurred images with original image based on circleOfConfusion
            this.depthOfFieldMerge = new DepthOfFieldMergePostProcess("depthOfFieldMerge", this.circleOfConfusion, this.depthOfFieldPass, 1, null, BABYLON.Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), true, pipelineTextureType);
            pipeline.addEffect(new PostProcessRenderEffect(scene.getEngine(), this.DepthOfFieldMergePostProcessId, () => { return this.depthOfFieldMerge; }, true));
        }

        public disposeEffects(camera:Camera){
            this.depthOfFieldPass.dispose(camera);
            this.circleOfConfusion.dispose(camera);
            this.depthOfFieldBlurX.dispose(camera);
            this.depthOfFieldBlurY.dispose(camera);
            this.depthOfFieldMerge.dispose(camera);
        }
    }
}