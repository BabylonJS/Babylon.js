
declare module BABYLON {
    class CloudProceduralTexture extends ProceduralTexture {
        private _skyColor;
        private _cloudColor;
        constructor(name: string, size: number, scene: Scene, fallbackTexture?: Texture, generateMipMaps?: boolean);
        updateShaderUniforms(): void;
        skyColor: Color4;
        cloudColor: Color4;
        /**
         * Serializes this cloud procedural texture
         * @returns a serialized cloud procedural texture object
         */
        serialize(): any;
        /**
         * Creates a Cloud Procedural Texture from parsed cloud procedural texture data
         * @param parsedTexture defines parsed texture data
         * @param scene defines the current scene
         * @param rootUrl defines the root URL containing cloud procedural texture information
         * @returns a parsed Cloud Procedural Texture
         */
        static Parse(parsedTexture: any, scene: Scene, rootUrl: string): CloudProceduralTexture;
    }
}
