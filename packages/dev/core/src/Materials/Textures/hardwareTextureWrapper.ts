/** @internal */
export interface HardwareTextureWrapper {
    underlyingResource: any;

    set(hardwareTexture: any): void;
    setUsage(textureSource: number, generateMipMaps: boolean, is2DArray: boolean, isCube: boolean, is3D: boolean, width: number, height: number, depth: number): void;
    reset(): void;
    release(): void;
}
