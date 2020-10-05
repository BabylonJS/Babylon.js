/** @hidden */
export interface HardwareTextureWrapper {

    underlyingResource: any;

    set(hardwareTexture: any): void;
    setUsage(textureSource: number, generateMipMaps: boolean, isCube: boolean, width: number, height: number): void;
    reset(): void;
    release(): void;
}
