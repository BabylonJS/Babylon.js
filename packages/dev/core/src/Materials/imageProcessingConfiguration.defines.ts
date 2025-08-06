import { MaterialDefines } from "./materialDefines";
/**
 * Interface to follow in your material defines to integrate easily the
 * Image processing functions.
 * @internal
 */
export interface IImageProcessingConfigurationDefines {
    IMAGEPROCESSING: boolean;
    VIGNETTE: boolean;
    VIGNETTEBLENDMODEMULTIPLY: boolean;
    VIGNETTEBLENDMODEOPAQUE: boolean;
    TONEMAPPING: number;
    CONTRAST: boolean;
    EXPOSURE: boolean;
    COLORCURVES: boolean;
    COLORGRADING: boolean;
    COLORGRADING3D: boolean;
    SAMPLER3DGREENDEPTH: boolean;
    SAMPLER3DBGRMAP: boolean;
    DITHER: boolean;
    IMAGEPROCESSINGPOSTPROCESS: boolean;
    SKIPFINALCOLORCLAMP: boolean;
}

type ImageProcessingDefinesMixinConstructor<T = {}> = new (...args: any[]) => T;

/**
 * Mixin to add Image processing defines to your material defines
 * @internal
 */
export function ImageProcessingDefinesMixin<Tbase extends ImageProcessingDefinesMixinConstructor>(base: Tbase) {
    return class extends base implements IImageProcessingConfigurationDefines {
        // Implement all members of IImageProcessingConfigurationDefines here
        public IMAGEPROCESSING = false;
        public VIGNETTE = false;
        public VIGNETTEBLENDMODEMULTIPLY = false;
        public VIGNETTEBLENDMODEOPAQUE = false;
        public TONEMAPPING = 0;
        public CONTRAST = false;
        public COLORCURVES = false;
        public COLORGRADING = false;
        public COLORGRADING3D = false;
        public SAMPLER3DGREENDEPTH = false;
        public SAMPLER3DBGRMAP = false;
        public DITHER = false;
        public IMAGEPROCESSINGPOSTPROCESS = false;
        public SKIPFINALCOLORCLAMP = false;
        public EXPOSURE = false;
        public MULTIVIEW = false;
        public ORDER_INDEPENDENT_TRANSPARENCY = false;
        public ORDER_INDEPENDENT_TRANSPARENCY_16BITS = false;
    };
}

/**
 * @internal
 */
export class ImageProcessingConfigurationDefines extends MaterialDefines implements IImageProcessingConfigurationDefines {
    public IMAGEPROCESSING = false;
    public VIGNETTE = false;
    public VIGNETTEBLENDMODEMULTIPLY = false;
    public VIGNETTEBLENDMODEOPAQUE = false;
    public TONEMAPPING = 0;
    public CONTRAST = false;
    public COLORCURVES = false;
    public COLORGRADING = false;
    public COLORGRADING3D = false;
    public SAMPLER3DGREENDEPTH = false;
    public SAMPLER3DBGRMAP = false;
    public DITHER = false;
    public IMAGEPROCESSINGPOSTPROCESS = false;
    public EXPOSURE = false;
    public SKIPFINALCOLORCLAMP = false;

    constructor() {
        super();
        this.rebuild();
    }
}
