module BABYLON {
    export class ImageProcessingPostProcess extends PostProcess {
		public colorGradingTexture: BaseTexture;
		public colorGradingWeight: number = 1.0;
		public colorCurves = new ColorCurves();

		public vignetteStretch: number;
		public vignetteCentreX: number;
		public vignetteCentreY: number;
		public vignetteWeight: number;
		public vignetteColor: BABYLON.Color4 = new BABYLON.Color4(0, 0, 0, 0);
		public vignetteBlendMode = ImageProcessingPostProcess.VIGNETTEMODE_MULTIPLY;

		public cameraContrast: number;
		public cameraExposureValue: number;
		public cameraToneMappingEnabled: boolean;

        constructor(name: string, options: number | PostProcessOptions, camera?: Camera, samplingMode?: number, engine?: Engine, reusable?: boolean) {
            super(name, "imageProcessing", [
                                            'contrast',
                                            'vignetteSettings1',
                                            'vignetteSettings2',
                                            'vignetteSettings3',
                                            'cameraExposureLinear',
                                            'toneMappingEnabled',
                                            'vCameraColorCurveNegative',
                                            'vCameraColorCurveNeutral',
                                            'vCameraColorCurvePositive',
                                            'hasTextureColorTransform',
                                            'colorTransformSettings'                    
                                            ], ["txColorTransform"], options, camera, samplingMode, engine, reusable);

            this.onApply = (effect: Effect) => {
                let aspectRatio = this.width / this.height;
                
                // Color 
                ColorCurves.Bind(this.colorCurves, effect);

                // Vignette
                let vignetteScaleY = 0;// TODO Math.tan(imageProcessing._scene.activeCamera.fov * 0.5);
                let vignetteScaleX = vignetteScaleY * aspectRatio;

                let vignetteScaleGeometricMean = Math.sqrt(vignetteScaleX * vignetteScaleY);
                vignetteScaleX = Tools.Mix(vignetteScaleX, vignetteScaleGeometricMean, this.vignetteStretch);
                vignetteScaleY = Tools.Mix(vignetteScaleY, vignetteScaleGeometricMean, this.vignetteStretch);

                effect.setFloat4('vignetteSettings1', vignetteScaleX, vignetteScaleY, -vignetteScaleX * this.vignetteCentreX, -vignetteScaleY * this.vignetteCentreY);

                let vignettePower = -2.0 * this.vignetteWeight;
                effect.setFloat4('vignetteSettings2', this.vignetteColor.r, this.vignetteColor.g, this.vignetteColor.b, vignettePower);

                effect.setFloat4('vignetteSettings3', 0, 0, 0, this.vignetteBlendMode);

                // Contrast and tonemapping
                effect.setFloat('contrast', this.cameraContrast);

                effect.setFloat('cameraExposureLinear', Math.pow(2.0, - this.cameraExposureValue) * Math.PI);
                effect.setFloat('toneMappingEnabled', this.cameraToneMappingEnabled ? 1.0 : 0.0);                
                
                // Color transform settings
                let hasColorGradingTexture = (this.colorGradingTexture != null) && this.colorGradingTexture.isReady();
                effect.setBool('hasTextureColorTransform', hasColorGradingTexture);
                //effect.setTexture('txColorTransform', hasColorGradingTexture ? this.colorGradingTexture : emptyTexture);
                let textureSize = hasColorGradingTexture ? this.colorGradingTexture.getSize().height : 1.0;

                effect.setFloat4("colorTransformSettings",
                    (textureSize - 1) / textureSize, // textureScale
                    0.5 / textureSize, // textureOffset
                    textureSize, // textureSize
                    hasColorGradingTexture ? this.colorGradingWeight : 0.0 // weight
                );                
            };
        }

        // Statics
        private static _VIGNETTEMODE_MULTIPLY = 1;
        private static _VIGNETTEMODE_OPAQUE = 2;

        public static get VIGNETTEMODE_MULTIPLY(): number {
            return ImageProcessingPostProcess._VIGNETTEMODE_MULTIPLY;
        }

        public static get VIGNETTEMODE_OPAQUE(): number {
            return ImageProcessingPostProcess._VIGNETTEMODE_OPAQUE;
        }
    }
}