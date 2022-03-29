

declare module 'babylonjs-procedural-textures' { 
    export = BABYLON; 
}

declare module BABYLON {
    class WoodProceduralTexture extends ProceduralTexture {
        private _ampScale;
        private _woodColor;
        constructor(name: string, size: number, scene: Scene, fallbackTexture?: Texture, generateMipMaps?: boolean);
        updateShaderUniforms(): void;
        ampScale: number;
        woodColor: Color3;
    }
}


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
        fireColors: Color3[];
        time: number;
        speed: Vector2;
        alphaThreshold: number;
    }
}


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


declare module BABYLON {
    class GrassProceduralTexture extends ProceduralTexture {
        private _grassColors;
        private _groundColor;
        constructor(name: string, size: number, scene: Scene, fallbackTexture?: Texture, generateMipMaps?: boolean);
        updateShaderUniforms(): void;
        grassColors: Color3[];
        groundColor: Color3;
    }
}


declare module BABYLON {
    class RoadProceduralTexture extends ProceduralTexture {
        private _roadColor;
        constructor(name: string, size: number, scene: Scene, fallbackTexture?: Texture, generateMipMaps?: boolean);
        updateShaderUniforms(): void;
        roadColor: Color3;
    }
}


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
    }
}


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
    }
}


declare module BABYLON {
    class StarfieldProceduralTexture extends ProceduralTexture {
        private _time;
        private _alpha;
        private _beta;
        private _zoom;
        private _formuparam;
        private _stepsize;
        private _tile;
        private _brightness;
        private _darkmatter;
        private _distfading;
        private _saturation;
        constructor(name: string, size: number, scene: Scene, fallbackTexture?: Texture, generateMipMaps?: boolean);
        updateShaderUniforms(): void;
        time: number;
        alpha: number;
        beta: number;
        formuparam: number;
        stepsize: number;
        zoom: number;
        tile: number;
        brightness: number;
        darkmatter: number;
        distfading: number;
        saturation: number;
    }
}


declare module BABYLON {
    class NormalMapProceduralTexture extends ProceduralTexture {
        private _baseTexture;
        constructor(name: string, size: number, scene: Scene, fallbackTexture?: Texture, generateMipMaps?: boolean);
        updateShaderUniforms(): void;
        render(useCameraPostProcess?: boolean): void;
        resize(size: any, generateMipMaps: any): void;
        baseTexture: Texture;
    }
}


declare module BABYLON {
    class PerlinNoiseProceduralTexture extends ProceduralTexture {
        time: number;
        speed: number;
        translationSpeed: number;
        private _currentTranslation;
        constructor(name: string, size: number, scene: Scene, fallbackTexture?: Texture, generateMipMaps?: boolean);
        updateShaderUniforms(): void;
        render(useCameraPostProcess?: boolean): void;
        resize(size: any, generateMipMaps: any): void;
    }
}
