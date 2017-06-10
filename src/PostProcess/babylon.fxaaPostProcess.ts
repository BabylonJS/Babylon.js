module BABYLON {
    export class FxaaPostProcess extends PostProcess {
        public texelWidth: number;
        public texelHeight: number;

        constructor(name: string, options: number | PostProcessOptions, camera: Camera, samplingMode?: number, engine?: Engine, reusable?: boolean, textureType: number = Engine.TEXTURETYPE_UNSIGNED_INT) {
            super(name, "fxaa", ["texelSize"], null, options, camera, samplingMode || BABYLON.Texture.BILINEAR_SAMPLINGMODE, engine, reusable, null, textureType, "fxaa");

            this.onApplyObservable.add((effect: Effect) => {
                var texelSize = this.texelSize;
                effect.setFloat2("texelSize", texelSize.x, texelSize.y);
            });
        }
    }
}