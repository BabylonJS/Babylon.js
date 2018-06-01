export interface IImageProcessingConfiguration {
    colorGradingEnabled?: boolean;
    colorCurvesEnabled?: boolean;
    colorCurves?: {
        globalHue?: number;
        globalDensity?: number;
        globalSaturation?: number;
        globalExposure?: number;
        highlightsHue?: number;
        highlightsDensity?: number;
        highlightsSaturation?: number;
        highlightsExposure?: number;
        midtonesHue?: number;
        midtonesDensity?: number;
        midtonesSaturation?: number;
        midtonesExposure?: number;
        shadowsHue?: number;
        shadowsDensity?: number;
        shadowsSaturation?: number;
        shadowsExposure?: number;
    };
    colorGradingWithGreenDepth?: boolean;
    colorGradingBGR?: boolean;
    exposure?: number;
    toneMappingEnabled?: boolean;
    contrast?: number;
    vignetteEnabled?: boolean;
    vignetteStretch?: number;
    vignetteCentreX?: number;
    vignetteCentreY?: number;
    vignetteWeight?: number;
    vignetteColor?: { r: number, g: number, b: number, a?: number };
    vignetteCameraFov?: number;
    vignetteBlendMode?: number;
    vignetteM?: boolean;
    applyByPostProcess?: boolean;
    isEnabled?: boolean;
}