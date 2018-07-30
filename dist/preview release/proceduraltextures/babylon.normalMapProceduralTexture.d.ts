
declare module BABYLON {
    class NormalMapProceduralTexture extends ProceduralTexture {
        private _baseTexture;
        constructor(name: string, size: number, scene: Scene, fallbackTexture?: Texture, generateMipMaps?: boolean);
        updateShaderUniforms(): void;
        render(useCameraPostProcess?: boolean): void;
        resize(size: any, generateMipMaps: any): void;
        baseTexture: Texture;
        /**
         * Serializes this normal map procedural texture
         * @returns a serialized normal map procedural texture object
         */
        serialize(): any;
        /**
         * Creates a Normal Map Procedural Texture from parsed normal map procedural texture data
         * @param parsedTexture defines parsed texture data
         * @param scene defines the current scene
         * @param rootUrl defines the root URL containing normal map procedural texture information
         * @returns a parsed Normal Map Procedural Texture
         */
        static Parse(parsedTexture: any, scene: Scene, rootUrl: string): NormalMapProceduralTexture;
    }
}
