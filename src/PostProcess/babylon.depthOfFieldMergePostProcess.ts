module BABYLON {
    export class DepthOfFieldMergePostProcess extends PostProcess {
        constructor(name: string, original: PostProcess, circleOfConfusion: PostProcess, options: number | PostProcessOptions, camera: Nullable<Camera>, samplingMode?: number, engine?: Engine, reusable?: boolean, textureType: number = Engine.TEXTURETYPE_UNSIGNED_INT) {
            super(name, "depthOfFieldMerge", [], ["circleOfConfusionSampler", "originalSampler"], options, camera, samplingMode, engine, reusable, null, textureType);
            this.onApplyObservable.add((effect: Effect) => {
                effect.setTextureFromPostProcess("circleOfConfusionSampler", circleOfConfusion);
                effect.setTextureFromPostProcess("originalSampler", original);
            })
        }
    }
}