declare module BABYLON {
    class WoodProceduralTexture extends ProceduralTexture {
        private _ampScale;
        private _woodColor;
        constructor(name: string, size: number, scene: Scene, fallbackTexture?: Texture, generateMipMaps?: boolean);
        public updateShaderUniforms(): void;
        public ampScale : number;
        public woodColor : Color3;
    }
    class FireProceduralTexture extends ProceduralTexture {
        private _time;
        private _speed;
        private _shift;
        private _autoGenerateTime;
        private _fireColors;
        private _alphaThreshold;
        constructor(name: string, size: number, scene: Scene, fallbackTexture?: Texture, generateMipMaps?: boolean);
        public updateShaderUniforms(): void;
        public render(useCameraPostProcess?: boolean): void;
        static PurpleFireColors : Color3[];
        static GreenFireColors : Color3[];
        static RedFireColors : Color3[];
        static BlueFireColors : Color3[];
        public fireColors : Color3[];
        public time : number;
        public speed : Vector2;
        public shift : number;
        public alphaThreshold : number;
    }
    class CloudProceduralTexture extends ProceduralTexture {
        private _skyColor;
        private _cloudColor;
        constructor(name: string, size: number, scene: Scene, fallbackTexture?: Texture, generateMipMaps?: boolean);
        public updateShaderUniforms(): void;
        public skyColor : Color3;
        public cloudColor : Color3;
    }
    class GrassProceduralTexture extends ProceduralTexture {
        private _grassColors;
        private _herb1;
        private _herb2;
        private _herb3;
        private _groundColor;
        constructor(name: string, size: number, scene: Scene, fallbackTexture?: Texture, generateMipMaps?: boolean);
        public updateShaderUniforms(): void;
        public grassColors : Color3[];
        public groundColor : Color3;
    }
    class RoadProceduralTexture extends ProceduralTexture {
        private _roadColor;
        constructor(name: string, size: number, scene: Scene, fallbackTexture?: Texture, generateMipMaps?: boolean);
        public updateShaderUniforms(): void;
        public roadColor : Color3;
    }
    class BrickProceduralTexture extends ProceduralTexture {
        private _numberOfBricksHeight;
        private _numberOfBricksWidth;
        private _jointColor;
        private _brickColor;
        constructor(name: string, size: number, scene: Scene, fallbackTexture?: Texture, generateMipMaps?: boolean);
        public updateShaderUniforms(): void;
        public numberOfBricksHeight : number;
        public cloudColor : number;
        public numberOfBricksWidth : number;
        public jointColor : Color3;
        public brickColor : Color3;
    }
    class MarbleProceduralTexture extends ProceduralTexture {
        private _numberOfTilesHeight;
        private _numberOfTilesWidth;
        private _amplitude;
        private _marbleColor;
        private _jointColor;
        constructor(name: string, size: number, scene: Scene, fallbackTexture?: Texture, generateMipMaps?: boolean);
        public updateShaderUniforms(): void;
        public numberOfTilesHeight : number;
        public numberOfTilesWidth : number;
        public jointColor : Color3;
        public marbleColor : Color3;
    }
}
