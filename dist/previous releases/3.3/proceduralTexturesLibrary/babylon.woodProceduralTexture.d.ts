
declare module BABYLON {
    class WoodProceduralTexture extends ProceduralTexture {
        private _ampScale;
        private _woodColor;
        constructor(name: string, size: number, scene: Scene, fallbackTexture?: Texture, generateMipMaps?: boolean);
        updateShaderUniforms(): void;
        ampScale: number;
        woodColor: Color3;
        /**
         * Serializes this wood procedural texture
         * @returns a serialized wood procedural texture object
         */
        serialize(): any;
        /**
         * Creates a Wood Procedural Texture from parsed wood procedural texture data
         * @param parsedTexture defines parsed texture data
         * @param scene defines the current scene
         * @param rootUrl defines the root URL containing wood procedural texture information
         * @returns a parsed Wood Procedural Texture
         */
        static Parse(parsedTexture: any, scene: Scene, rootUrl: string): WoodProceduralTexture;
    }
}
