
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
        /**
         * Serializes this brick procedural texture
         * @returns a serialized brick procedural texture object
         */
        serialize(): any;
        /**
         * Creates a Brick Procedural Texture from parsed brick procedural texture data
         * @param parsedTexture defines parsed texture data
         * @param scene defines the current scene
         * @param rootUrl defines the root URL containing brick procedural texture information
         * @returns a parsed Brick Procedural Texture
         */
        static Parse(parsedTexture: any, scene: Scene, rootUrl: string): BrickProceduralTexture;
    }
}
