module BABYLON {
    export class ImageProcessingPostProcess extends PostProcess {
		private _colorGradingTexture: BaseTexture;
		public colorGradingWeight: number = 1.0;
		public colorCurves = new ColorCurves();

		public vignetteStretch = 0;
		public vignetteCentreX = 0;
		public vignetteCentreY = 0;
		public vignetteWeight = 1.5;
		public vignetteColor: BABYLON.Color4 = new BABYLON.Color4(0, 0, 0, 0);
		private _vignetteBlendMode = ImageProcessingPostProcess.VIGNETTEMODE_MULTIPLY;

		public cameraContrast = 1.0;
		public cameraExposureValue = 1.5;
		private _cameraToneMappingEnabled = true;

        public get colorGradingTexture(): BaseTexture {
            return this._colorGradingTexture;
        }

        public set colorGradingTexture(value: BaseTexture) {
            if (this._colorGradingTexture === value) {
                return;
            }

            this._colorGradingTexture = value;
            this._updateParameters();
        }

        public get vignetteBlendMode(): number {
            return this._vignetteBlendMode;
        }

        public set vignetteBlendMode(value: number) {
            if (this._vignetteBlendMode === value) {
                return;
            }

            this._vignetteBlendMode = value;
            this._updateParameters();
        }     

        public get cameraToneMappingEnabled(): boolean {
            return this._cameraToneMappingEnabled;
        }

        public set cameraToneMappingEnabled(value: boolean) {
            if (this._cameraToneMappingEnabled === value) {
                return;
            }

            this._cameraToneMappingEnabled = value;
            this._updateParameters();
        }               

        constructor(name: string, options: number | PostProcessOptions, camera?: Camera, samplingMode?: number, engine?: Engine, reusable?: boolean, textureType: number = Engine.TEXTURETYPE_UNSIGNED_INT) {
            super(name, "imageProcessing", [
                                            'contrast',
                                            'vignetteSettings1',
                                            'vignetteSettings2',
                                            'cameraExposureLinear',
                                            'vCameraColorCurveNegative',
                                            'vCameraColorCurveNeutral',
                                            'vCameraColorCurvePositive',
                                            'colorTransformSettings'                    
                                            ], ["txColorTransform"], options, camera, samplingMode, engine, reusable,
                                            null, textureType, "postprocess", null, true);

            this._updateParameters();

            this.onApply = (effect: Effect) => {
                let aspectRatio = this.aspectRatio;
                
                // Color 
                ColorCurves.Bind(this.colorCurves, effect);

                // Vignette
                let vignetteScaleY = Math.tan(this.getCamera().fov * 0.5);
                let vignetteScaleX = vignetteScaleY * aspectRatio;

                let vignetteScaleGeometricMean = Math.sqrt(vignetteScaleX * vignetteScaleY);
                vignetteScaleX = Tools.Mix(vignetteScaleX, vignetteScaleGeometricMean, this.vignetteStretch);
                vignetteScaleY = Tools.Mix(vignetteScaleY, vignetteScaleGeometricMean, this.vignetteStretch);

                effect.setFloat4('vignetteSettings1', vignetteScaleX, vignetteScaleY, -vignetteScaleX * this.vignetteCentreX, -vignetteScaleY * this.vignetteCentreY);

                let vignettePower = -2.0 * this.vignetteWeight;
                effect.setFloat4('vignetteSettings2', this.vignetteColor.r, this.vignetteColor.g, this.vignetteColor.b, vignettePower);

                // Contrast and exposure
                effect.setFloat('contrast', this.cameraContrast);
                effect.setFloat('cameraExposureLinear', Math.pow(2.0, -this.cameraExposureValue) * Math.PI);
                
                // Color transform settings
                if (this._colorGradingTexture) {
                    effect.setTexture('txColorTransform', this.colorGradingTexture);
                    let textureSize = this.colorGradingTexture.getSize().height;

                    effect.setFloat4("colorTransformSettings",
                        (textureSize - 1) / textureSize, // textureScale
                        0.5 / textureSize, // textureOffset
                        textureSize, // textureSize
                        this.colorGradingWeight // weight
                    );                
                }
            };
        }

        protected _updateParameters(): void {
            var defines = "";
            var samplers = ["textureSampler"];

            if (this.colorGradingTexture) {
                defines = "#define COLORGRADING\r\n";
                samplers.push("txColorTransform");
            }

            if (this.vignetteBlendMode === ImageProcessingPostProcess._VIGNETTEMODE_MULTIPLY) {
                defines += "#define VIGNETTEBLENDMODEMULTIPLY\r\n";
            } else {
                defines += "#define VIGNETTEBLENDMODEOPAQUE\r\n";
            }

            if (this.cameraToneMappingEnabled) {
                defines += "#define TONEMAPPING\r\n";
            }

            this.updateEffect(defines, null, samplers);
        }

        // Statics
        private static _VIGNETTEMODE_MULTIPLY = 0;
        private static _VIGNETTEMODE_OPAQUE = 1;

        public static get VIGNETTEMODE_MULTIPLY(): number {
            return ImageProcessingPostProcess._VIGNETTEMODE_MULTIPLY;
        }

        public static get VIGNETTEMODE_OPAQUE(): number {
            return ImageProcessingPostProcess._VIGNETTEMODE_OPAQUE;
        }
    }
}