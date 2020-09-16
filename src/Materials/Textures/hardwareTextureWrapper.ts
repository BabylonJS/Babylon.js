/** @hidden */
export interface HardwareTextureWrapper {

    underlyingResource: any;

    set(hardwareTexture: any): void;
    reset(): void;
    release(): void;
}
