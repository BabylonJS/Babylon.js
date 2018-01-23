module BABYLON {    
    export class DepthOfFieldBlurPostProcess extends BlurPostProcess {
        constructor(name: string, public direction: Vector2, kernel: number, options: number | PostProcessOptions, camera: Nullable<Camera>, depthMap:RenderTargetTexture, imageToBlur:Nullable<PostProcess> = null, samplingMode: number = Texture.BILINEAR_SAMPLINGMODE, engine?: Engine, reusable?: boolean, textureType: number = Engine.TEXTURETYPE_UNSIGNED_INT) {
            super(name, direction, kernel, options, camera, samplingMode = Texture.BILINEAR_SAMPLINGMODE, engine, reusable, textureType = Engine.TEXTURETYPE_UNSIGNED_INT)
            this._staticDefines += `#define DOF 1\r\n`;
			
			this.onApplyObservable.add((effect: Effect) => {
                // TODO: setTextureFromPostProcess seems to be setting the input texture instead of output of the post process passed in 
                if(imageToBlur != null){
                    effect.setTextureFromPostProcess("textureSampler", imageToBlur)
                }
                effect.setTexture("depthSampler", depthMap)
                
				// TODO: is there a better way to get camera?
                var camera = this.getEngine().scenes[0].activeCamera;
                if(camera){
                    effect.setFloat('near', camera.minZ);
                    effect.setFloat('far', camera.maxZ);
                }
			});
        }
    }
}