
declare module BABYLON {
    class BrickProceduralTexture extends ProceduralTexture {
        private _numberOfBricksHeight;
        private _numberOfBricksWidth;
        private _jointColor;
        private _brickColor;
        constructor(name: string, size: number, scene: Scene, fallbackTexture?: Texture, generateMipMaps?: boolean);
        updateShaderUniforms(): void;
        numberOfBricksHeight: number;
        numberOfBricksWidth: number;
        jointColor: Color3;
        brickColor: Color3;
    }
}
