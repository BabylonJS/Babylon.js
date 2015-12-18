module BABYLON
{
    export enum TonemappingOperator
    {
        Hable = 0,
        Reinhard = 1,
        HejiDawson = 2,
        Photographic = 3,
    };

    export class TonemapPostProcess extends PostProcess
    {
        private _operator : TonemappingOperator;
        private _exposureAdjustment : number;

        constructor(name: string, operator: TonemappingOperator, exposureAdjustment: number, camera: Camera, samplingMode: number = Texture.BILINEAR_SAMPLINGMODE, engine?: Engine, textureFormat = Engine.TEXTURETYPE_UNSIGNED_INT)
        {
            this._operator = operator;
            this._exposureAdjustment = exposureAdjustment;

            var params = ["_ExposureAdjustment"];
            var defines = "#define ";

            if (operator === TonemappingOperator.Hable)
                defines += "HABLE_TONEMAPPING";
            else if (operator === TonemappingOperator.Reinhard)
                defines += "REINHARD_TONEMAPPING";
            else if (operator === TonemappingOperator.HejiDawson)
                defines += "OPTIMIZED_HEJIDAWSON_TONEMAPPING";
            else if (operator === TonemappingOperator.Photographic)
                defines += "PHOTOGRAPHIC_TONEMAPPING";

            super(name, "tonemap", params, null, 1.0, camera, samplingMode, engine, true, defines, textureFormat);

            this.onApply = (effect: Effect) =>
            {
                effect.setFloat("_ExposureAdjustment", this._exposureAdjustment);
            };
        }
    }
}