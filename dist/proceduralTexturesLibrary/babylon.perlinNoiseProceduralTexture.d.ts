
declare module BABYLON {
    class PerlinNoiseProceduralTexture extends ProceduralTexture {
        time: number;
        timeScale: number;
        translationSpeed: number;
        private _currentTranslation;
        constructor(name: string, size: number, scene: Scene, fallbackTexture?: Texture, generateMipMaps?: boolean);
        updateShaderUniforms(): void;
        render(useCameraPostProcess?: boolean): void;
        resize(size: any, generateMipMaps: any): void;
        /**
         * Serializes this perlin noise procedural texture
         * @returns a serialized perlin noise procedural texture object
         */
        serialize(): any;
        /**
         * Creates a Perlin Noise Procedural Texture from parsed perlin noise procedural texture data
         * @param parsedTexture defines parsed texture data
         * @param scene defines the current scene
         * @param rootUrl defines the root URL containing perlin noise procedural texture information
         * @returns a parsed Perlin Noise Procedural Texture
         */
        static Parse(parsedTexture: any, scene: Scene, rootUrl: string): PerlinNoiseProceduralTexture;
    }
}
