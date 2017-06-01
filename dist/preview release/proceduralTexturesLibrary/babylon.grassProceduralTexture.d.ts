
declare module BABYLON {
    class GrassProceduralTexture extends ProceduralTexture {
        private _grassColors;
        private _herb1;
        private _herb2;
        private _herb3;
        private _groundColor;
        constructor(name: string, size: number, scene: Scene, fallbackTexture?: Texture, generateMipMaps?: boolean);
        updateShaderUniforms(): void;
        grassColors: Color3[];
        groundColor: Color3;
    }
}
