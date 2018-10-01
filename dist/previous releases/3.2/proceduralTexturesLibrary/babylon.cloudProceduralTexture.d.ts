
declare module BABYLON {
    class CloudProceduralTexture extends ProceduralTexture {
        private _skyColor;
        private _cloudColor;
        constructor(name: string, size: number, scene: Scene, fallbackTexture?: Texture, generateMipMaps?: boolean);
        updateShaderUniforms(): void;
        skyColor: Color4;
        cloudColor: Color4;
    }
}
