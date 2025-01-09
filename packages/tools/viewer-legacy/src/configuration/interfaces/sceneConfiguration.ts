import type { IImageProcessingConfiguration } from "./imageProcessingConfiguration";
import type { IColorGradingConfiguration } from "./colorGradingConfiguration";
import type { IGlowLayerOptions } from "core/Layers/glowLayer";

export interface ISceneConfiguration {
    debug?: boolean;
    clearColor?: { r: number; g: number; b: number; a: number };
    /** @deprecated Please use environmentMap.mainColor instead. */
    mainColor?: { r?: number; g?: number; b?: number };
    imageProcessingConfiguration?: IImageProcessingConfiguration;
    environmentTexture?: string;
    colorGrading?: IColorGradingConfiguration;
    environmentRotationY?: number;
    /** @deprecated Please use default rendering pipeline. */
    glow?: boolean | IGlowLayerOptions;
    disableHdr?: boolean;
    renderInBackground?: boolean;
    disableCameraControl?: boolean;
    animationPropertiesOverride?: {
        [propName: string]: any;
    };
    defaultMaterial?: {
        materialType: "standard" | "pbr";
        [propName: string]: any;
    };
    flags?: {
        shadowsEnabled?: boolean;
        particlesEnabled?: boolean;
        collisionsEnabled?: boolean;
        lightsEnabled?: boolean;
        texturesEnabled?: boolean;
        lensFlaresEnabled?: boolean;
        proceduralTexturesEnabled?: boolean;
        renderTargetsEnabled?: boolean;
        spritesEnabled?: boolean;
        skeletonsEnabled?: boolean;
        audioEnabled?: boolean;
    };
    assetsRootURL?: string;
}
