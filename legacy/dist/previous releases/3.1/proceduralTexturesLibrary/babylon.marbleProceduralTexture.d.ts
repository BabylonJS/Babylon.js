
declare module BABYLON {
    class MarbleProceduralTexture extends ProceduralTexture {
        private _numberOfTilesHeight;
        private _numberOfTilesWidth;
        private _amplitude;
        private _jointColor;
        constructor(name: string, size: number, scene: Scene, fallbackTexture?: Texture, generateMipMaps?: boolean);
        updateShaderUniforms(): void;
        numberOfTilesHeight: number;
        amplitude: number;
        numberOfTilesWidth: number;
        jointColor: Color3;
    }
}
