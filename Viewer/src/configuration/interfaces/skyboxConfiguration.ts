import { IImageProcessingConfiguration } from "./imageProcessingConfiguration";

export interface ISkyboxConfiguration {
    cubeTexture?: {
        noMipMap?: boolean;
        gammaSpace?: boolean;
        url?: string | Array<string>;
    };
    color?: { r: number, g: number, b: number };
    /** @deprecated */ pbr?: boolean;
    scale?: number;
    /** @deprecated */ blur?: number;
    material?: {
        imageProcessingConfiguration?: IImageProcessingConfiguration;
        [propName: string]: any;
    };
    infiniteDistance?: boolean;

}