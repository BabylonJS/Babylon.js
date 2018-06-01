export interface ILightConfiguration {
    type: number;
    name?: string;
    disabled?: boolean;
    position?: { x: number, y: number, z: number };
    target?: { x: number, y: number, z: number };
    direction?: { x: number, y: number, z: number };
    diffuse?: { r: number, g: number, b: number };
    specular?: { r: number, g: number, b: number };
    intensity?: number;
    intensityMode?: number;
    radius?: number;
    shadownEnabled?: boolean; // only on specific lights!
    shadowConfig?: {
        useBlurExponentialShadowMap?: boolean;
        useBlurCloseExponentialShadowMap?: boolean;
        useKernelBlur?: boolean;
        blurKernel?: number;
        blurScale?: number;
        minZ?: number;
        maxZ?: number;
        frustumSize?: number;
        angleScale?: number;
        frustumEdgeFalloff?: number;
        [propName: string]: any;
    };
    spotAngle?: number;
    shadowFieldOfView?: number;
    shadowBufferSize?: number;
    shadowFrustumSize?: number;
    shadowMinZ?: number;
    shadowMaxZ?: number;
    [propName: string]: any;

    // no behaviors for light at the moment, but allowing configuration for future reference.
    behaviors?: {
        [name: string]: number | {
            type: number;
            [propName: string]: any;
        };
    };
}