declare module BABYLON {
    class CustomProceduralTexture extends ProceduralTexture {
        private _animate;
        private _time;
        private _config;
        private _texturePath;
        constructor(name: string, texturePath: any, size: number, scene: Scene, fallbackTexture?: Texture, generateMipMaps?: boolean);
        private loadJson(jsonUrl);
        public isReady(): boolean;
        public render(useCameraPostProcess?: boolean): void;
        public updateTextures(): void;
        public updateShaderUniforms(): void;
        public animate : boolean;
    }
}
