declare module BABYLON {
    /** @hidden */
    export var brickProceduralTexturePixelShader: {
        name: string;
        shader: string;
    };
}
declare module BABYLON {
    export class BrickProceduralTexture extends BABYLON.ProceduralTexture {
        private _numberOfBricksHeight;
        private _numberOfBricksWidth;
        private _jointColor;
        private _brickColor;
        constructor(name: string, size: number, scene: BABYLON.Scene, fallbackTexture?: BABYLON.Texture, generateMipMaps?: boolean);
        updateShaderUniforms(): void;
        numberOfBricksHeight: number;
        numberOfBricksWidth: number;
        jointColor: BABYLON.Color3;
        brickColor: BABYLON.Color3;
        /**
         * Serializes this brick procedural texture
         * @returns a serialized brick procedural texture object
         */
        serialize(): any;
        /**
         * Creates a Brick Procedural BABYLON.Texture from parsed brick procedural texture data
         * @param parsedTexture defines parsed texture data
         * @param scene defines the current scene
         * @param rootUrl defines the root URL containing brick procedural texture information
         * @returns a parsed Brick Procedural BABYLON.Texture
         */
        static Parse(parsedTexture: any, scene: BABYLON.Scene, rootUrl: string): BrickProceduralTexture;
    }
}
declare module BABYLON {
    /** @hidden */
    export var cloudProceduralTexturePixelShader: {
        name: string;
        shader: string;
    };
}
declare module BABYLON {
    export class CloudProceduralTexture extends BABYLON.ProceduralTexture {
        private _skyColor;
        private _cloudColor;
        constructor(name: string, size: number, scene: BABYLON.Scene, fallbackTexture?: BABYLON.Texture, generateMipMaps?: boolean);
        updateShaderUniforms(): void;
        skyColor: BABYLON.Color4;
        cloudColor: BABYLON.Color4;
        /**
         * Serializes this cloud procedural texture
         * @returns a serialized cloud procedural texture object
         */
        serialize(): any;
        /**
         * Creates a Cloud Procedural BABYLON.Texture from parsed cloud procedural texture data
         * @param parsedTexture defines parsed texture data
         * @param scene defines the current scene
         * @param rootUrl defines the root URL containing cloud procedural texture information
         * @returns a parsed Cloud Procedural BABYLON.Texture
         */
        static Parse(parsedTexture: any, scene: BABYLON.Scene, rootUrl: string): CloudProceduralTexture;
    }
}
declare module BABYLON {
    /** @hidden */
    export var fireProceduralTexturePixelShader: {
        name: string;
        shader: string;
    };
}
declare module BABYLON {
    export class FireProceduralTexture extends BABYLON.ProceduralTexture {
        private _time;
        private _speed;
        private _autoGenerateTime;
        private _fireColors;
        private _alphaThreshold;
        constructor(name: string, size: number, scene: BABYLON.Scene, fallbackTexture?: BABYLON.Texture, generateMipMaps?: boolean);
        updateShaderUniforms(): void;
        render(useCameraPostProcess?: boolean): void;
        static readonly PurpleFireColors: BABYLON.Color3[];
        static readonly GreenFireColors: BABYLON.Color3[];
        static readonly RedFireColors: BABYLON.Color3[];
        static readonly BlueFireColors: BABYLON.Color3[];
        autoGenerateTime: boolean;
        fireColors: BABYLON.Color3[];
        time: number;
        speed: BABYLON.Vector2;
        alphaThreshold: number;
        /**
         * Serializes this fire procedural texture
         * @returns a serialized fire procedural texture object
         */
        serialize(): any;
        /**
         * Creates a Fire Procedural BABYLON.Texture from parsed fire procedural texture data
         * @param parsedTexture defines parsed texture data
         * @param scene defines the current scene
         * @param rootUrl defines the root URL containing fire procedural texture information
         * @returns a parsed Fire Procedural BABYLON.Texture
         */
        static Parse(parsedTexture: any, scene: BABYLON.Scene, rootUrl: string): FireProceduralTexture;
    }
}
declare module BABYLON {
    /** @hidden */
    export var grassProceduralTexturePixelShader: {
        name: string;
        shader: string;
    };
}
declare module BABYLON {
    export class GrassProceduralTexture extends BABYLON.ProceduralTexture {
        private _grassColors;
        private _groundColor;
        constructor(name: string, size: number, scene: BABYLON.Scene, fallbackTexture?: BABYLON.Texture, generateMipMaps?: boolean);
        updateShaderUniforms(): void;
        grassColors: BABYLON.Color3[];
        groundColor: BABYLON.Color3;
        /**
         * Serializes this grass procedural texture
         * @returns a serialized grass procedural texture object
         */
        serialize(): any;
        /**
         * Creates a Grass Procedural BABYLON.Texture from parsed grass procedural texture data
         * @param parsedTexture defines parsed texture data
         * @param scene defines the current scene
         * @param rootUrl defines the root URL containing grass procedural texture information
         * @returns a parsed Grass Procedural BABYLON.Texture
         */
        static Parse(parsedTexture: any, scene: BABYLON.Scene, rootUrl: string): GrassProceduralTexture;
    }
}
declare module BABYLON {
    /** @hidden */
    export var marbleProceduralTexturePixelShader: {
        name: string;
        shader: string;
    };
}
declare module BABYLON {
    export class MarbleProceduralTexture extends BABYLON.ProceduralTexture {
        private _numberOfTilesHeight;
        private _numberOfTilesWidth;
        private _amplitude;
        private _jointColor;
        constructor(name: string, size: number, scene: BABYLON.Scene, fallbackTexture?: BABYLON.Texture, generateMipMaps?: boolean);
        updateShaderUniforms(): void;
        numberOfTilesHeight: number;
        amplitude: number;
        numberOfTilesWidth: number;
        jointColor: BABYLON.Color3;
        /**
         * Serializes this marble procedural texture
         * @returns a serialized marble procedural texture object
         */
        serialize(): any;
        /**
         * Creates a Marble Procedural BABYLON.Texture from parsed marble procedural texture data
         * @param parsedTexture defines parsed texture data
         * @param scene defines the current scene
         * @param rootUrl defines the root URL containing marble procedural texture information
         * @returns a parsed Marble Procedural BABYLON.Texture
         */
        static Parse(parsedTexture: any, scene: BABYLON.Scene, rootUrl: string): MarbleProceduralTexture;
    }
}
declare module BABYLON {
    /** @hidden */
    export var normalMapProceduralTexturePixelShader: {
        name: string;
        shader: string;
    };
}
declare module BABYLON {
    export class NormalMapProceduralTexture extends BABYLON.ProceduralTexture {
        private _baseTexture;
        constructor(name: string, size: number, scene: BABYLON.Scene, fallbackTexture?: BABYLON.Texture, generateMipMaps?: boolean);
        updateShaderUniforms(): void;
        render(useCameraPostProcess?: boolean): void;
        resize(size: any, generateMipMaps: any): void;
        baseTexture: BABYLON.Texture;
        /**
         * Serializes this normal map procedural texture
         * @returns a serialized normal map procedural texture object
         */
        serialize(): any;
        /**
         * Creates a Normal Map Procedural BABYLON.Texture from parsed normal map procedural texture data
         * @param parsedTexture defines parsed texture data
         * @param scene defines the current scene
         * @param rootUrl defines the root URL containing normal map procedural texture information
         * @returns a parsed Normal Map Procedural BABYLON.Texture
         */
        static Parse(parsedTexture: any, scene: BABYLON.Scene, rootUrl: string): NormalMapProceduralTexture;
    }
}
declare module BABYLON {
    /** @hidden */
    export var perlinNoiseProceduralTexturePixelShader: {
        name: string;
        shader: string;
    };
}
declare module BABYLON {
    export class PerlinNoiseProceduralTexture extends BABYLON.ProceduralTexture {
        time: number;
        timeScale: number;
        translationSpeed: number;
        private _currentTranslation;
        constructor(name: string, size: number, scene: BABYLON.Scene, fallbackTexture?: BABYLON.Texture, generateMipMaps?: boolean);
        updateShaderUniforms(): void;
        render(useCameraPostProcess?: boolean): void;
        resize(size: any, generateMipMaps: any): void;
        /**
         * Serializes this perlin noise procedural texture
         * @returns a serialized perlin noise procedural texture object
         */
        serialize(): any;
        /**
         * Creates a Perlin Noise Procedural BABYLON.Texture from parsed perlin noise procedural texture data
         * @param parsedTexture defines parsed texture data
         * @param scene defines the current scene
         * @param rootUrl defines the root URL containing perlin noise procedural texture information
         * @returns a parsed Perlin Noise Procedural BABYLON.Texture
         */
        static Parse(parsedTexture: any, scene: BABYLON.Scene, rootUrl: string): PerlinNoiseProceduralTexture;
    }
}
declare module BABYLON {
    /** @hidden */
    export var roadProceduralTexturePixelShader: {
        name: string;
        shader: string;
    };
}
declare module BABYLON {
    export class RoadProceduralTexture extends BABYLON.ProceduralTexture {
        private _roadColor;
        constructor(name: string, size: number, scene: BABYLON.Scene, fallbackTexture?: BABYLON.Texture, generateMipMaps?: boolean);
        updateShaderUniforms(): void;
        roadColor: BABYLON.Color3;
        /**
         * Serializes this road procedural texture
         * @returns a serialized road procedural texture object
         */
        serialize(): any;
        /**
         * Creates a Road Procedural BABYLON.Texture from parsed road procedural texture data
         * @param parsedTexture defines parsed texture data
         * @param scene defines the current scene
         * @param rootUrl defines the root URL containing road procedural texture information
         * @returns a parsed Road Procedural BABYLON.Texture
         */
        static Parse(parsedTexture: any, scene: BABYLON.Scene, rootUrl: string): RoadProceduralTexture;
    }
}
declare module BABYLON {
    /** @hidden */
    export var starfieldProceduralTexturePixelShader: {
        name: string;
        shader: string;
    };
}
declare module BABYLON {
    export class StarfieldProceduralTexture extends BABYLON.ProceduralTexture {
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
        constructor(name: string, size: number, scene: BABYLON.Scene, fallbackTexture?: BABYLON.Texture, generateMipMaps?: boolean);
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
        /**
         * Serializes this starfield procedural texture
         * @returns a serialized starfield procedural texture object
         */
        serialize(): any;
        /**
         * Creates a Starfield Procedural BABYLON.Texture from parsed startfield procedural texture data
         * @param parsedTexture defines parsed texture data
         * @param scene defines the current scene
         * @param rootUrl defines the root URL containing startfield procedural texture information
         * @returns a parsed Starfield Procedural BABYLON.Texture
         */
        static Parse(parsedTexture: any, scene: BABYLON.Scene, rootUrl: string): StarfieldProceduralTexture;
    }
}
declare module BABYLON {
    /** @hidden */
    export var woodProceduralTexturePixelShader: {
        name: string;
        shader: string;
    };
}
declare module BABYLON {
    export class WoodProceduralTexture extends BABYLON.ProceduralTexture {
        private _ampScale;
        private _woodColor;
        constructor(name: string, size: number, scene: BABYLON.Scene, fallbackTexture?: BABYLON.Texture, generateMipMaps?: boolean);
        updateShaderUniforms(): void;
        ampScale: number;
        woodColor: BABYLON.Color3;
        /**
         * Serializes this wood procedural texture
         * @returns a serialized wood procedural texture object
         */
        serialize(): any;
        /**
         * Creates a Wood Procedural BABYLON.Texture from parsed wood procedural texture data
         * @param parsedTexture defines parsed texture data
         * @param scene defines the current scene
         * @param rootUrl defines the root URL containing wood procedural texture information
         * @returns a parsed Wood Procedural BABYLON.Texture
         */
        static Parse(parsedTexture: any, scene: BABYLON.Scene, rootUrl: string): WoodProceduralTexture;
    }
}