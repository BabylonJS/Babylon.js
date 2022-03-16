
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
        /**
         * Serializes this marble procedural texture
         * @returns a serialized marble procedural texture object
         */
        serialize(): any;
        /**
         * Creates a Marble Procedural Texture from parsed marble procedural texture data
         * @param parsedTexture defines parsed texture data
         * @param scene defines the current scene
         * @param rootUrl defines the root URL containing marble procedural texture information
         * @returns a parsed Marble Procedural Texture
         */
        static Parse(parsedTexture: any, scene: Scene, rootUrl: string): MarbleProceduralTexture;
    }
}
