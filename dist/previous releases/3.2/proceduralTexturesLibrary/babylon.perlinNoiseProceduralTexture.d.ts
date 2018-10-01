
declare module BABYLON {
    class PerlinNoiseProceduralTexture extends ProceduralTexture {
        time: number;
        speed: number;
        translationSpeed: number;
        private _currentTranslation;
        constructor(name: string, size: number, scene: Scene, fallbackTexture?: Texture, generateMipMaps?: boolean);
        updateShaderUniforms(): void;
        render(useCameraPostProcess?: boolean): void;
        resize(size: any, generateMipMaps: any): void;
    }
}
