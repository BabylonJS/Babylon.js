
declare module BABYLON {
    class WoodProceduralTexture extends ProceduralTexture {
        private _ampScale;
        private _woodColor;
        constructor(name: string, size: number, scene: Scene, fallbackTexture?: Texture, generateMipMaps?: boolean);
        updateShaderUniforms(): void;
        ampScale: number;
        woodColor: Color3;
    }
}
