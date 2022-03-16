/**
 * The Color Grading Configuration groups the different settings used to define the color grading used in the viewer.
 */
export interface IColorGradingConfiguration {

    /**
     * Transform data string, encoded as determined by transformDataFormat.
     */
    transformData: string;

    /**
     * The encoding format of TransformData (currently only raw-base16 is supported).
     */
    transformDataFormat: string;

    /**
     * The weight of the transform
     */
    transformWeight: number;

    /**
     * Color curve colorFilterHueGlobal value
     */
    colorFilterHueGlobal: number;

    /**
     * Color curve colorFilterHueShadows value
     */
    colorFilterHueShadows: number;

    /**
     * Color curve colorFilterHueMidtones value
     */
    colorFilterHueMidtones: number;

    /**
     * Color curve colorFilterHueHighlights value
     */
    colorFilterHueHighlights: number;

    /**
     * Color curve colorFilterDensityGlobal value
     */
    colorFilterDensityGlobal: number;

    /**
     * Color curve colorFilterDensityShadows value
     */
    colorFilterDensityShadows: number;

    /**
     * Color curve colorFilterDensityMidtones value
     */
    colorFilterDensityMidtones: number;

    /**
     * Color curve colorFilterDensityHighlights value
     */
    colorFilterDensityHighlights: number;

    /**
     * Color curve saturationGlobal value
     */
    saturationGlobal: number;

    /**
     * Color curve saturationShadows value
     */
    saturationShadows: number;

    /**
     * Color curve saturationMidtones value
     */
    saturationMidtones: number;

    /**
     * Color curve saturationHighlights value
     */
    saturationHighlights: number;

    /**
     * Color curve exposureGlobal value
     */
    exposureGlobal: number;

    /**
     * Color curve exposureShadows value
     */
    exposureShadows: number;

    /**
     * Color curve exposureMidtones value
     */
    exposureMidtones: number;

    /**
     * Color curve exposureHighlights value
     */
    exposureHighlights: number;

}