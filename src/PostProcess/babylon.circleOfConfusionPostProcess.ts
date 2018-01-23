module BABYLON {
    export class CircleOfConfusionPostProcess extends PostProcess {
        lensSize = 50 // in scene units/1000 (eg. millimeter)
        fStop = 1.4; // Aperture = lensSize/fStop
        focusDistance = 15000; // in scene units/1000 (eg. millimeter)
        focalLength = 500; // in scene units/1000 (eg. millimeter)

        
        constructor(name: string, depthTexture: RenderTargetTexture, options: number | PostProcessOptions, camera: Camera, samplingMode?: number, engine?: Engine, reusable?: boolean, textureType: number = Engine.TEXTURETYPE_UNSIGNED_INT) {
            super(name, "circleOfConfusion", ["cameraMinMaxZ", "focusDistance", "cocPrecalculation"], ["depthSampler"], options, camera, samplingMode, engine, reusable, null, textureType);
            this.onApplyObservable.add((effect: Effect) => {
                effect.setTexture("depthSampler", depthTexture);
                
                // Circle of confusion calculation, See https://developer.nvidia.com/gpugems/GPUGems/gpugems_ch23.html
                var aperture = this.lensSize/this.fStop;
                var cocPrecalculation = ((aperture * this.focalLength)/((this.focusDistance - this.focalLength)));// * ((this.focusDistance - pixelDistance)/pixelDistance) [This part is done in shader]
                
                effect.setFloat('focusDistance', this.focusDistance);
                effect.setFloat('cocPrecalculation', cocPrecalculation);
                
                effect.setFloat2("cameraMinMaxZ", camera.minZ, camera.maxZ);
            })
        }
    }
}