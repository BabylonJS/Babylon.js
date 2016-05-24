//
//  This post-process allows the modification of rendered colors by using
//  a 'look-up table' (LUT). This effect is also called Color Grading.
// 
//  The object needs to be provided an url to a texture containing the color
//  look-up table: the texture must be 256 pixels wide and 16 pixels high.
//  Use an image editing software to tweak the LUT to match your needs.
// 
//  For an example of a color LUT, see here:
//      http://udn.epicgames.com/Three/rsrc/Three/ColorGrading/RGBTable16x1.png
//  For explanations on color grading, see here:
//      http://udn.epicgames.com/Three/ColorGrading.html
//

module BABYLON {
    export class ColorCorrectionPostProcess extends PostProcess {

        private _colorTableTexture: Texture;

        constructor(name: string, colorTableUrl: string, ratio: number | PostProcessOptions, camera: Camera, samplingMode?: number, engine?: Engine, reusable?: boolean) {
            super(name, 'colorCorrection', null, ['colorTable'], ratio, camera, samplingMode, engine, reusable);

            this._colorTableTexture = new Texture(colorTableUrl, camera.getScene(), true, false, Texture.TRILINEAR_SAMPLINGMODE);
            this._colorTableTexture.anisotropicFilteringLevel = 1;
            this._colorTableTexture.wrapU = Texture.CLAMP_ADDRESSMODE;
            this._colorTableTexture.wrapV = Texture.CLAMP_ADDRESSMODE;

            this.onApply = (effect: Effect) => {
                effect.setTexture("colorTable", this._colorTableTexture);
            };
        }
    }
}