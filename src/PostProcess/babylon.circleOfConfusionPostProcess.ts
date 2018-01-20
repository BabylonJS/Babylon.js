module BABYLON {
    export class CircleOfConfusionPostProcess extends PostProcess {
        fStop = 4; // Aperture = focalLength/fStop
        focusDistance = 15; // in scene units (eg. meter)
        focalLength = 10; // in scene units/1000 (eg. millimeter)

        
        constructor(name: string, depthTexture: RenderTargetTexture, options: number | PostProcessOptions, camera: Nullable<Camera>, samplingMode?: number, engine?: Engine, reusable?: boolean, textureType: number = Engine.TEXTURETYPE_UNSIGNED_INT) {
            super(name, "circleOfConfusion", ["near", "far", "focusDistance", "cocPrecalculation"], ["depthSampler"], options, camera, samplingMode, engine, reusable, null, textureType);
            this.onApplyObservable.add((effect: Effect) => {
                effect.setTexture("depthSampler", depthTexture);
                
                // Circle of confusion calculation, See https://developer.nvidia.com/gpugems/GPUGems/gpugems_ch23.html
                var aperture = this.focalLength/this.fStop;
                var cocPrecalculation = ((aperture * this.focalLength)/((this.focusDistance - this.focalLength)));// * ((this.focusDistance - pixelDistance)/pixelDistance) [This part is done in shader]
                
                effect.setFloat('focusDistance', this.focusDistance);
                effect.setFloat('cocPrecalculation', cocPrecalculation);
                
                // TODO: is there a better way to get camera?
                var camera = this.getEngine().scenes[0].activeCamera;
                if(camera){
                    effect.setFloat('near', camera.minZ);
                    effect.setFloat('far', camera.maxZ);
                }
            })
        }
    }
}