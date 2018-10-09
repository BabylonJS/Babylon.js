/*BabylonJS Procedural Textures*/
// Dependencies for this module:
//   ../../../../Tools/Gulp/babylonjs

declare module 'babylonjs-procedural-textures' {
    export * from "babylonjs-procedural-textures/src/brick";
    export * from "babylonjs-procedural-textures/src/cloud";
    export * from "babylonjs-procedural-textures/src/fire";
    export * from "babylonjs-procedural-textures/src/grass";
    export * from "babylonjs-procedural-textures/src/marble";
    export * from "babylonjs-procedural-textures/src/normalMap";
    export * from "babylonjs-procedural-textures/src/perlinNoise";
    export * from "babylonjs-procedural-textures/src/road";
    export * from "babylonjs-procedural-textures/src/starfield";
    export * from "babylonjs-procedural-textures/src/wood";
}

declare module 'babylonjs-procedural-textures/src/brick' {
    export * from "babylonjs-procedural-textures/src/brick/brickProceduralTexture";
}

declare module 'babylonjs-procedural-textures/src/cloud' {
    export * from "babylonjs-procedural-textures/src/cloud/cloudProceduralTexture";
}

declare module 'babylonjs-procedural-textures/src/fire' {
    export * from "babylonjs-procedural-textures/src/fire/fireProceduralTexture";
}

declare module 'babylonjs-procedural-textures/src/grass' {
    export * from "babylonjs-procedural-textures/src/grass/grassProceduralTexture";
}

declare module 'babylonjs-procedural-textures/src/marble' {
    export * from "babylonjs-procedural-textures/src/marble/marbleProceduralTexture";
}

declare module 'babylonjs-procedural-textures/src/normalMap' {
    export * from "babylonjs-procedural-textures/src/normalMap/normalMapProceduralTexture";
}

declare module 'babylonjs-procedural-textures/src/perlinNoise' {
    export * from "babylonjs-procedural-textures/src/perlinNoise/perlinNoiseProceduralTexture";
}

declare module 'babylonjs-procedural-textures/src/road' {
    export * from "babylonjs-procedural-textures/src/road/roadProceduralTexture";
}

declare module 'babylonjs-procedural-textures/src/starfield' {
    export * from "babylonjs-procedural-textures/src/starfield/starfieldProceduralTexture";
}

declare module 'babylonjs-procedural-textures/src/wood' {
    export * from "babylonjs-procedural-textures/src/wood/woodProceduralTexture";
}

declare module 'babylonjs-procedural-textures/src/brick/brickProceduralTexture' {
    import { ProceduralTexture, Color3, Scene, Texture } from "babylonjs";
    export class BrickProceduralTexture extends ProceduralTexture {
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

declare module 'babylonjs-procedural-textures/src/cloud/cloudProceduralTexture' {
    import { ProceduralTexture, Color4, Scene, Texture } from "babylonjs";
    export class CloudProceduralTexture extends ProceduralTexture {
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

declare module 'babylonjs-procedural-textures/src/fire/fireProceduralTexture' {
    import { ProceduralTexture, Vector2, Color3, Scene, Texture } from "babylonjs";
    export class FireProceduralTexture extends ProceduralTexture {
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

declare module 'babylonjs-procedural-textures/src/grass/grassProceduralTexture' {
    import { ProceduralTexture, Color3, Scene, Texture } from "babylonjs";
    export class GrassProceduralTexture extends ProceduralTexture {
            constructor(name: string, size: number, scene: Scene, fallbackTexture?: Texture, generateMipMaps?: boolean);
            updateShaderUniforms(): void;
            grassColors: Color3[];
            groundColor: Color3;
            /**
                * Serializes this grass procedural texture
                * @returns a serialized grass procedural texture object
                */
            serialize(): any;
            /**
                * Creates a Grass Procedural Texture from parsed grass procedural texture data
                * @param parsedTexture defines parsed texture data
                * @param scene defines the current scene
                * @param rootUrl defines the root URL containing grass procedural texture information
                * @returns a parsed Grass Procedural Texture
                */
            static Parse(parsedTexture: any, scene: Scene, rootUrl: string): GrassProceduralTexture;
    }
}

declare module 'babylonjs-procedural-textures/src/marble/marbleProceduralTexture' {
    import { ProceduralTexture, Color3, Scene, Texture } from "babylonjs";
    export class MarbleProceduralTexture extends ProceduralTexture {
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

declare module 'babylonjs-procedural-textures/src/normalMap/normalMapProceduralTexture' {
    import { ProceduralTexture, Texture, Scene } from "babylonjs";
    export class NormalMapProceduralTexture extends ProceduralTexture {
            constructor(name: string, size: number, scene: Scene, fallbackTexture?: Texture, generateMipMaps?: boolean);
            updateShaderUniforms(): void;
            render(useCameraPostProcess?: boolean): void;
            resize(size: any, generateMipMaps: any): void;
            baseTexture: Texture;
            /**
                * Serializes this normal map procedural texture
                * @returns a serialized normal map procedural texture object
                */
            serialize(): any;
            /**
                * Creates a Normal Map Procedural Texture from parsed normal map procedural texture data
                * @param parsedTexture defines parsed texture data
                * @param scene defines the current scene
                * @param rootUrl defines the root URL containing normal map procedural texture information
                * @returns a parsed Normal Map Procedural Texture
                */
            static Parse(parsedTexture: any, scene: Scene, rootUrl: string): NormalMapProceduralTexture;
    }
}

declare module 'babylonjs-procedural-textures/src/perlinNoise/perlinNoiseProceduralTexture' {
    import { ProceduralTexture, Scene, Texture } from "babylonjs";
    export class PerlinNoiseProceduralTexture extends ProceduralTexture {
            time: number;
            timeScale: number;
            translationSpeed: number;
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

declare module 'babylonjs-procedural-textures/src/road/roadProceduralTexture' {
    import { ProceduralTexture, Color3, Scene, Texture } from "babylonjs";
    export class RoadProceduralTexture extends ProceduralTexture {
            constructor(name: string, size: number, scene: Scene, fallbackTexture?: Texture, generateMipMaps?: boolean);
            updateShaderUniforms(): void;
            roadColor: Color3;
            /**
                * Serializes this road procedural texture
                * @returns a serialized road procedural texture object
                */
            serialize(): any;
            /**
                * Creates a Road Procedural Texture from parsed road procedural texture data
                * @param parsedTexture defines parsed texture data
                * @param scene defines the current scene
                * @param rootUrl defines the root URL containing road procedural texture information
                * @returns a parsed Road Procedural Texture
                */
            static Parse(parsedTexture: any, scene: Scene, rootUrl: string): RoadProceduralTexture;
    }
}

declare module 'babylonjs-procedural-textures/src/starfield/starfieldProceduralTexture' {
    import { ProceduralTexture, Scene, Texture } from "babylonjs";
    export class StarfieldProceduralTexture extends ProceduralTexture {
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
            /**
                * Serializes this starfield procedural texture
                * @returns a serialized starfield procedural texture object
                */
            serialize(): any;
            /**
                * Creates a Starfield Procedural Texture from parsed startfield procedural texture data
                * @param parsedTexture defines parsed texture data
                * @param scene defines the current scene
                * @param rootUrl defines the root URL containing startfield procedural texture information
                * @returns a parsed Starfield Procedural Texture
                */
            static Parse(parsedTexture: any, scene: Scene, rootUrl: string): StarfieldProceduralTexture;
    }
}

declare module 'babylonjs-procedural-textures/src/wood/woodProceduralTexture' {
    import { ProceduralTexture, Color3, Scene, Texture } from "babylonjs";
    export class WoodProceduralTexture extends ProceduralTexture {
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


/*BabylonJS Procedural Textures*/
// Dependencies for this module:
//   ../../../../Tools/Gulp/babylonjs
declare module BABYLON {
    export class BrickProceduralTexture extends BABYLON.ProceduralTexture {
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
    export class CloudProceduralTexture extends BABYLON.ProceduralTexture {
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
    export class FireProceduralTexture extends BABYLON.ProceduralTexture {
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
    export class GrassProceduralTexture extends BABYLON.ProceduralTexture {
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
    export class MarbleProceduralTexture extends BABYLON.ProceduralTexture {
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
    export class NormalMapProceduralTexture extends BABYLON.ProceduralTexture {
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
    export class PerlinNoiseProceduralTexture extends BABYLON.ProceduralTexture {
            time: number;
            timeScale: number;
            translationSpeed: number;
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
    export class RoadProceduralTexture extends BABYLON.ProceduralTexture {
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
    export class StarfieldProceduralTexture extends BABYLON.ProceduralTexture {
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
    export class WoodProceduralTexture extends BABYLON.ProceduralTexture {
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