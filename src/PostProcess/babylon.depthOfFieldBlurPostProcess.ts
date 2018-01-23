module BABYLON {    
    export class DepthOfFieldBlurPostProcess extends BlurPostProcess {
        constructor(name: string, public direction: Vector2, kernel: number, options: number | PostProcessOptions, camera: Camera, depthMap:RenderTargetTexture, imageToBlur:Nullable<PostProcess> = null, samplingMode: number = Texture.BILINEAR_SAMPLINGMODE, engine?: Engine, reusable?: boolean, textureType: number = Engine.TEXTURETYPE_UNSIGNED_INT) {
            // TODO: passing in camera here unexpectedly causes the 1 frame behind issue and forces me to make the calling of this reusable.
            super(name, direction, kernel, options, null, samplingMode = Texture.BILINEAR_SAMPLINGMODE, engine, reusable, textureType = Engine.TEXTURETYPE_UNSIGNED_INT)
            this._staticDefines += `#define DOF 1\r\n`;
			
			this.onApplyObservable.add((effect: Effect) => {
                // TODO: setTextureFromPostProcess seems to be setting the input texture instead of output of the post process passed in 
                if(imageToBlur != null){
                    effect.setTextureFromPostProcess("textureSampler", imageToBlur)
                }
                effect.setTexture("depthSampler", depthMap)
                
                effect.setFloat2('cameraMinMaxZ', camera.minZ, camera.maxZ);
			});
        }
    }
}