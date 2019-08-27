
declare module BABYLON {
    class FireProceduralTexture extends ProceduralTexture {
        private _time;
        private _speed;
        private _autoGenerateTime;
        private _fireColors;
        private _alphaThreshold;
        constructor(name: string, size: number, scene: Scene, fallbackTexture?: Texture, generateMipMaps?: boolean);
        updateShaderUniforms(): void;
        render(useCameraPostProcess?: boolean): void;
        static readonly PurpleFireColors: Color3[];
        static readonly GreenFireColors: Color3[];
        static readonly RedFireColors: Color3[];
        static readonly BlueFireColors: Color3[];
        autoGenerateTime: boolean;
        fireColors: Color3[];
        time: number;
        speed: Vector2;
        alphaThreshold: number;
        /**
         * Serializes this fire procedural texture
         * @returns a serialized fire procedural texture object
         */
        serialize(): any;
        /**
         * Creates a Fire Procedural Texture from parsed fire procedural texture data
         * @param parsedTexture defines parsed texture data
         * @param scene defines the current scene
         * @param rootUrl defines the root URL containing fire procedural texture information
         * @returns a parsed Fire Procedural Texture
         */
        static Parse(parsedTexture: any, scene: Scene, rootUrl: string): FireProceduralTexture;
    }
}
