export interface IGroundConfiguration {
    size?: number;
    receiveShadows?: boolean;
    shadowLevel?: number;
    shadowOnly?: boolean; // deprecated
    mirror?: boolean | {
        sizeRatio?: number;
        blurKernel?: number;
        amount?: number;
        fresnelWeight?: number;
        fallOffDistance?: number;
        textureType?: number;
    };
    texture?: string;
    color?: { r: number, g: number, b: number };
    opacity?: number;
    material?: {
        [propName: string]: any;
    };
}