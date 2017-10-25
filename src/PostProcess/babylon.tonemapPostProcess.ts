module BABYLON {
    export enum TonemappingOperator {
        Hable = 0,
        Reinhard = 1,
        HejiDawson = 2,
        Photographic = 3,
    };

    export class TonemapPostProcess extends PostProcess {

        constructor(name: string, private _operator: TonemappingOperator, public exposureAdjustment: number, camera: Camera, samplingMode: number = Texture.BILINEAR_SAMPLINGMODE, engine?: Engine, textureFormat = Engine.TEXTURETYPE_UNSIGNED_INT) {
            super(name, "tonemap", ["_ExposureAdjustment"], null, 1.0, camera, samplingMode, engine, true, null, textureFormat);

            var defines = "#define ";

            if (this._operator === TonemappingOperator.Hable)
                defines += "HABLE_TONEMAPPING";
            else if (this._operator === TonemappingOperator.Reinhard)
                defines += "REINHARD_TONEMAPPING";
            else if (this._operator === TonemappingOperator.HejiDawson)
                defines += "OPTIMIZED_HEJIDAWSON_TONEMAPPING";
            else if (this._operator === TonemappingOperator.Photographic)
                defines += "PHOTOGRAPHIC_TONEMAPPING";
                
            //sadly a second call to create the effect.
            this.updateEffect(defines);


            this.onApply = (effect: Effect) => {
                effect.setFloat("_ExposureAdjustment", this.exposureAdjustment);
            };
        }
    }
}
