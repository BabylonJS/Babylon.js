import { IImageProcessingConfiguration } from "./imageProcessingConfiguration";

export interface ISkyboxConfiguration {
    cubeTexture?: {
        noMipMap?: boolean;
        gammaSpace?: boolean;
        url?: string | Array<string>;
    };
    color?: { r: number, g: number, b: number };
    pbr?: boolean; // deprecated
    scale?: number;
    blur?: number; // deprecated
    material?: {
        imageProcessingConfiguration?: IImageProcessingConfiguration;
        [propName: string]: any;
    };
    infiniteDistance?: boolean;

}