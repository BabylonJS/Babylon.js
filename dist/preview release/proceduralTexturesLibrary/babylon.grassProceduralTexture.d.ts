
declare module BABYLON {
    class GrassProceduralTexture extends ProceduralTexture {
        private _grassColors;
        private _groundColor;
        constructor(name: string, size: number, scene: Scene, fallbackTexture?: Texture, generateMipMaps?: boolean);
        updateShaderUniforms(): void;
        grassColors: Color3[];
        groundColor: Color3;
    }
}
