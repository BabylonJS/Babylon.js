/*BabylonJS Materials*/
// Dependencies for this module:
//   ../../../../Tools/Gulp/babylonjs
declare module BABYLON {
    export class CellMaterial extends BABYLON.PushMaterial {
        diffuseTexture: BABYLON.BaseTexture;
        diffuseColor: BABYLON.Color3;
        _computeHighLevel: boolean;
        computeHighLevel: boolean;
        disableLighting: boolean;
        maxSimultaneousLights: number;
        constructor(name: string, scene: BABYLON.Scene);
        needAlphaBlending(): boolean;
        needAlphaTesting(): boolean;
        getAlphaTestTexture(): BABYLON.Nullable<BABYLON.BaseTexture>;
        isReadyForSubMesh(mesh: BABYLON.AbstractMesh, subMesh: BABYLON.SubMesh, useInstances?: boolean): boolean;
        bindForSubMesh(world: BABYLON.Matrix, mesh: BABYLON.Mesh, subMesh: BABYLON.SubMesh): void;
        getAnimatables(): BABYLON.IAnimatable[];
        getActiveTextures(): BABYLON.BaseTexture[];
        hasTexture(texture: BABYLON.BaseTexture): boolean;
        dispose(forceDisposeEffect?: boolean): void;
        getClassName(): string;
        clone(name: string): CellMaterial;
        serialize(): any;
        static Parse(source: any, scene: BABYLON.Scene, rootUrl: string): CellMaterial;
    }
}
declare module BABYLON {
    export class CustomShaderStructure {
        FragmentStore: string;
        VertexStore: string;
        constructor();
    }
    export class ShaderSpecialParts {
        constructor();
        Fragment_Begin: string;
        Fragment_Definitions: string;
        Fragment_MainBegin: string;
        Fragment_Custom_Diffuse: string;
        Fragment_Custom_Alpha: string;
        Fragment_Before_FragColor: string;
        Vertex_Begin: string;
        Vertex_Definitions: string;
        Vertex_MainBegin: string;
        Vertex_Before_PositionUpdated: string;
        Vertex_Before_NormalUpdated: string;
    }
    export class CustomMaterial extends BABYLON.StandardMaterial {
        static ShaderIndexer: number;
        CustomParts: ShaderSpecialParts;
        _isCreatedShader: boolean;
        _createdShaderName: string;
        _customUniform: string[];
        _newUniforms: string[];
        _newUniformInstances: any[];
        _newSamplerInstances: BABYLON.Texture[];
        FragmentShader: string;
        VertexShader: string;
        AttachAfterBind(mesh: BABYLON.Mesh, effect: BABYLON.Effect): void;
        ReviewUniform(name: string, arr: string[]): string[];
        Builder(shaderName: string, uniforms: string[], uniformBuffers: string[], samplers: string[], defines: BABYLON.StandardMaterialDefines): string;
        constructor(name: string, scene: BABYLON.Scene);
        AddUniform(name: string, kind: string, param: any): CustomMaterial;
        Fragment_Begin(shaderPart: string): CustomMaterial;
        Fragment_Definitions(shaderPart: string): CustomMaterial;
        Fragment_MainBegin(shaderPart: string): CustomMaterial;
        Fragment_Custom_Diffuse(shaderPart: string): CustomMaterial;
        Fragment_Custom_Alpha(shaderPart: string): CustomMaterial;
        Fragment_Before_FragColor(shaderPart: string): CustomMaterial;
        Vertex_Begin(shaderPart: string): CustomMaterial;
        Vertex_Definitions(shaderPart: string): CustomMaterial;
        Vertex_MainBegin(shaderPart: string): CustomMaterial;
        Vertex_Before_PositionUpdated(shaderPart: string): CustomMaterial;
        Vertex_Before_NormalUpdated(shaderPart: string): CustomMaterial;
    }
}
declare module BABYLON {
    export class FireMaterial extends BABYLON.PushMaterial {
        diffuseTexture: BABYLON.Nullable<BABYLON.BaseTexture>;
        distortionTexture: BABYLON.Nullable<BABYLON.BaseTexture>;
        opacityTexture: BABYLON.Nullable<BABYLON.BaseTexture>;
        diffuseColor: BABYLON.Color3;
        speed: number;
        constructor(name: string, scene: BABYLON.Scene);
        needAlphaBlending(): boolean;
        needAlphaTesting(): boolean;
        getAlphaTestTexture(): BABYLON.Nullable<BABYLON.BaseTexture>;
        isReadyForSubMesh(mesh: BABYLON.AbstractMesh, subMesh: BABYLON.SubMesh, useInstances?: boolean): boolean;
        bindForSubMesh(world: BABYLON.Matrix, mesh: BABYLON.Mesh, subMesh: BABYLON.SubMesh): void;
        getAnimatables(): BABYLON.IAnimatable[];
        getActiveTextures(): BABYLON.BaseTexture[];
        hasTexture(texture: BABYLON.BaseTexture): boolean;
        getClassName(): string;
        dispose(forceDisposeEffect?: boolean): void;
        clone(name: string): FireMaterial;
        serialize(): any;
        static Parse(source: any, scene: BABYLON.Scene, rootUrl: string): FireMaterial;
    }
}
declare module BABYLON {
    export class FurMaterial extends BABYLON.PushMaterial {
        diffuseTexture: BABYLON.BaseTexture;
        heightTexture: BABYLON.BaseTexture;
        diffuseColor: BABYLON.Color3;
        furLength: number;
        furAngle: number;
        furColor: BABYLON.Color3;
        furOffset: number;
        furSpacing: number;
        furGravity: BABYLON.Vector3;
        furSpeed: number;
        furDensity: number;
        furOcclusion: number;
        furTexture: BABYLON.DynamicTexture;
        disableLighting: boolean;
        maxSimultaneousLights: number;
        highLevelFur: boolean;
        _meshes: BABYLON.AbstractMesh[];
        constructor(name: string, scene: BABYLON.Scene);
        furTime: number;
        needAlphaBlending(): boolean;
        needAlphaTesting(): boolean;
        getAlphaTestTexture(): BABYLON.Nullable<BABYLON.BaseTexture>;
        updateFur(): void;
        isReadyForSubMesh(mesh: BABYLON.AbstractMesh, subMesh: BABYLON.SubMesh, useInstances?: boolean): boolean;
        bindForSubMesh(world: BABYLON.Matrix, mesh: BABYLON.Mesh, subMesh: BABYLON.SubMesh): void;
        getAnimatables(): BABYLON.IAnimatable[];
        getActiveTextures(): BABYLON.BaseTexture[];
        hasTexture(texture: BABYLON.BaseTexture): boolean;
        dispose(forceDisposeEffect?: boolean): void;
        clone(name: string): FurMaterial;
        serialize(): any;
        getClassName(): string;
        static Parse(source: any, scene: BABYLON.Scene, rootUrl: string): FurMaterial;
        static GenerateTexture(name: string, scene: BABYLON.Scene): BABYLON.DynamicTexture;
        static FurifyMesh(sourceMesh: BABYLON.Mesh, quality: number): BABYLON.Mesh[];
    }
}
declare module BABYLON {
    export class GradientMaterial extends BABYLON.PushMaterial {
        maxSimultaneousLights: number;
        topColor: BABYLON.Color3;
        topColorAlpha: number;
        bottomColor: BABYLON.Color3;
        bottomColorAlpha: number;
        offset: number;
        scale: number;
        smoothness: number;
        disableLighting: boolean;
        constructor(name: string, scene: BABYLON.Scene);
        needAlphaBlending(): boolean;
        needAlphaTesting(): boolean;
        getAlphaTestTexture(): BABYLON.Nullable<BABYLON.BaseTexture>;
        isReadyForSubMesh(mesh: BABYLON.AbstractMesh, subMesh: BABYLON.SubMesh, useInstances?: boolean): boolean;
        bindForSubMesh(world: BABYLON.Matrix, mesh: BABYLON.Mesh, subMesh: BABYLON.SubMesh): void;
        getAnimatables(): BABYLON.IAnimatable[];
        dispose(forceDisposeEffect?: boolean): void;
        clone(name: string): GradientMaterial;
        serialize(): any;
        getClassName(): string;
        static Parse(source: any, scene: BABYLON.Scene, rootUrl: string): GradientMaterial;
    }
}
declare module BABYLON {
    /**
        * The grid materials allows you to wrap any shape with a grid.
        * Colors are customizable.
        */
    export class GridMaterial extends BABYLON.PushMaterial {
            /**
                * Main color of the grid (e.g. between lines)
                */
            mainColor: BABYLON.Color3;
            /**
                * Color of the grid lines.
                */
            lineColor: BABYLON.Color3;
            /**
                * The scale of the grid compared to unit.
                */
            gridRatio: number;
            /**
                * Allows setting an offset for the grid lines.
                */
            gridOffset: BABYLON.Vector3;
            /**
                * The frequency of thicker lines.
                */
            majorUnitFrequency: number;
            /**
                * The visibility of minor units in the grid.
                */
            minorUnitVisibility: number;
            /**
                * The grid opacity outside of the lines.
                */
            opacity: number;
            /**
                * Determine RBG output is premultiplied by alpha value.
                */
            preMultiplyAlpha: boolean;
            /**
                * constructor
                * @param name The name given to the material in order to identify it afterwards.
                * @param scene The scene the material is used in.
                */
            constructor(name: string, scene: BABYLON.Scene);
            /**
                * Returns wehter or not the grid requires alpha blending.
                */
            needAlphaBlending(): boolean;
            needAlphaBlendingForMesh(mesh: BABYLON.AbstractMesh): boolean;
            isReadyForSubMesh(mesh: BABYLON.AbstractMesh, subMesh: BABYLON.SubMesh, useInstances?: boolean): boolean;
            bindForSubMesh(world: BABYLON.Matrix, mesh: BABYLON.Mesh, subMesh: BABYLON.SubMesh): void;
            /**
                * Dispose the material and its associated resources.
                * @param forceDisposeEffect will also dispose the used effect when true
                */
            dispose(forceDisposeEffect?: boolean): void;
            clone(name: string): GridMaterial;
            serialize(): any;
            getClassName(): string;
            static Parse(source: any, scene: BABYLON.Scene, rootUrl: string): GridMaterial;
    }
}
declare module BABYLON {
    export class LavaMaterial extends BABYLON.PushMaterial {
        diffuseTexture: BABYLON.BaseTexture;
        noiseTexture: BABYLON.BaseTexture;
        fogColor: BABYLON.Color3;
        speed: number;
        movingSpeed: number;
        lowFrequencySpeed: number;
        fogDensity: number;
        diffuseColor: BABYLON.Color3;
        disableLighting: boolean;
        unlit: boolean;
        maxSimultaneousLights: number;
        constructor(name: string, scene: BABYLON.Scene);
        needAlphaBlending(): boolean;
        needAlphaTesting(): boolean;
        getAlphaTestTexture(): BABYLON.Nullable<BABYLON.BaseTexture>;
        isReadyForSubMesh(mesh: BABYLON.AbstractMesh, subMesh: BABYLON.SubMesh, useInstances?: boolean): boolean;
        bindForSubMesh(world: BABYLON.Matrix, mesh: BABYLON.Mesh, subMesh: BABYLON.SubMesh): void;
        getAnimatables(): BABYLON.IAnimatable[];
        getActiveTextures(): BABYLON.BaseTexture[];
        hasTexture(texture: BABYLON.BaseTexture): boolean;
        dispose(forceDisposeEffect?: boolean): void;
        clone(name: string): LavaMaterial;
        serialize(): any;
        getClassName(): string;
        static Parse(source: any, scene: BABYLON.Scene, rootUrl: string): LavaMaterial;
    }
}
declare module BABYLON {
    export class MixMaterial extends BABYLON.PushMaterial {
            mixTexture1: BABYLON.BaseTexture;
            mixTexture2: BABYLON.BaseTexture;
            diffuseTexture1: BABYLON.Texture;
            diffuseTexture2: BABYLON.Texture;
            diffuseTexture3: BABYLON.Texture;
            diffuseTexture4: BABYLON.Texture;
            diffuseTexture5: BABYLON.Texture;
            diffuseTexture6: BABYLON.Texture;
            diffuseTexture7: BABYLON.Texture;
            diffuseTexture8: BABYLON.Texture;
            /**
                * Uniforms
                */
            diffuseColor: BABYLON.Color3;
            specularColor: BABYLON.Color3;
            specularPower: number;
            disableLighting: boolean;
            maxSimultaneousLights: number;
            constructor(name: string, scene: BABYLON.Scene);
            needAlphaBlending(): boolean;
            needAlphaTesting(): boolean;
            getAlphaTestTexture(): BABYLON.Nullable<BABYLON.BaseTexture>;
            isReadyForSubMesh(mesh: BABYLON.AbstractMesh, subMesh: BABYLON.SubMesh, useInstances?: boolean): boolean;
            bindForSubMesh(world: BABYLON.Matrix, mesh: BABYLON.Mesh, subMesh: BABYLON.SubMesh): void;
            getAnimatables(): BABYLON.IAnimatable[];
            getActiveTextures(): BABYLON.BaseTexture[];
            hasTexture(texture: BABYLON.BaseTexture): boolean;
            dispose(forceDisposeEffect?: boolean): void;
            clone(name: string): MixMaterial;
            serialize(): any;
            getClassName(): string;
            static Parse(source: any, scene: BABYLON.Scene, rootUrl: string): MixMaterial;
    }
}
declare module BABYLON {
    export class NormalMaterial extends BABYLON.PushMaterial {
        diffuseTexture: BABYLON.BaseTexture;
        diffuseColor: BABYLON.Color3;
        disableLighting: boolean;
        maxSimultaneousLights: number;
        constructor(name: string, scene: BABYLON.Scene);
        needAlphaBlending(): boolean;
        needAlphaTesting(): boolean;
        getAlphaTestTexture(): BABYLON.Nullable<BABYLON.BaseTexture>;
        isReadyForSubMesh(mesh: BABYLON.AbstractMesh, subMesh: BABYLON.SubMesh, useInstances?: boolean): boolean;
        bindForSubMesh(world: BABYLON.Matrix, mesh: BABYLON.Mesh, subMesh: BABYLON.SubMesh): void;
        getAnimatables(): BABYLON.IAnimatable[];
        getActiveTextures(): BABYLON.BaseTexture[];
        hasTexture(texture: BABYLON.BaseTexture): boolean;
        dispose(forceDisposeEffect?: boolean): void;
        clone(name: string): NormalMaterial;
        serialize(): any;
        getClassName(): string;
        static Parse(source: any, scene: BABYLON.Scene, rootUrl: string): NormalMaterial;
    }
}
declare module BABYLON {
    export class ShadowOnlyMaterial extends BABYLON.PushMaterial {
        constructor(name: string, scene: BABYLON.Scene);
        shadowColor: BABYLON.Color3;
        needAlphaBlending(): boolean;
        needAlphaTesting(): boolean;
        getAlphaTestTexture(): BABYLON.Nullable<BABYLON.BaseTexture>;
        activeLight: BABYLON.IShadowLight;
        isReadyForSubMesh(mesh: BABYLON.AbstractMesh, subMesh: BABYLON.SubMesh, useInstances?: boolean): boolean;
        bindForSubMesh(world: BABYLON.Matrix, mesh: BABYLON.Mesh, subMesh: BABYLON.SubMesh): void;
        clone(name: string): ShadowOnlyMaterial;
        serialize(): any;
        getClassName(): string;
        static Parse(source: any, scene: BABYLON.Scene, rootUrl: string): ShadowOnlyMaterial;
    }
}
declare module BABYLON {
    export class SimpleMaterial extends BABYLON.PushMaterial {
        diffuseTexture: BABYLON.BaseTexture;
        diffuseColor: BABYLON.Color3;
        disableLighting: boolean;
        maxSimultaneousLights: number;
        constructor(name: string, scene: BABYLON.Scene);
        needAlphaBlending(): boolean;
        needAlphaTesting(): boolean;
        getAlphaTestTexture(): BABYLON.Nullable<BABYLON.BaseTexture>;
        isReadyForSubMesh(mesh: BABYLON.AbstractMesh, subMesh: BABYLON.SubMesh, useInstances?: boolean): boolean;
        bindForSubMesh(world: BABYLON.Matrix, mesh: BABYLON.Mesh, subMesh: BABYLON.SubMesh): void;
        getAnimatables(): BABYLON.IAnimatable[];
        getActiveTextures(): BABYLON.BaseTexture[];
        hasTexture(texture: BABYLON.BaseTexture): boolean;
        dispose(forceDisposeEffect?: boolean): void;
        clone(name: string): SimpleMaterial;
        serialize(): any;
        getClassName(): string;
        static Parse(source: any, scene: BABYLON.Scene, rootUrl: string): SimpleMaterial;
    }
}
declare module BABYLON {
    export class SkyMaterial extends BABYLON.PushMaterial {
        luminance: number;
        turbidity: number;
        rayleigh: number;
        mieCoefficient: number;
        mieDirectionalG: number;
        distance: number;
        inclination: number;
        azimuth: number;
        sunPosition: BABYLON.Vector3;
        useSunPosition: boolean;
        constructor(name: string, scene: BABYLON.Scene);
        needAlphaBlending(): boolean;
        needAlphaTesting(): boolean;
        getAlphaTestTexture(): BABYLON.Nullable<BABYLON.BaseTexture>;
        isReadyForSubMesh(mesh: BABYLON.AbstractMesh, subMesh: BABYLON.SubMesh, useInstances?: boolean): boolean;
        bindForSubMesh(world: BABYLON.Matrix, mesh: BABYLON.Mesh, subMesh: BABYLON.SubMesh): void;
        getAnimatables(): BABYLON.IAnimatable[];
        dispose(forceDisposeEffect?: boolean): void;
        clone(name: string): SkyMaterial;
        serialize(): any;
        getClassName(): string;
        static Parse(source: any, scene: BABYLON.Scene, rootUrl: string): SkyMaterial;
    }
}
declare module BABYLON {
    export class TerrainMaterial extends BABYLON.PushMaterial {
        mixTexture: BABYLON.BaseTexture;
        diffuseTexture1: BABYLON.Texture;
        diffuseTexture2: BABYLON.Texture;
        diffuseTexture3: BABYLON.Texture;
        bumpTexture1: BABYLON.Texture;
        bumpTexture2: BABYLON.Texture;
        bumpTexture3: BABYLON.Texture;
        diffuseColor: BABYLON.Color3;
        specularColor: BABYLON.Color3;
        specularPower: number;
        disableLighting: boolean;
        maxSimultaneousLights: number;
        constructor(name: string, scene: BABYLON.Scene);
        needAlphaBlending(): boolean;
        needAlphaTesting(): boolean;
        getAlphaTestTexture(): BABYLON.Nullable<BABYLON.BaseTexture>;
        isReadyForSubMesh(mesh: BABYLON.AbstractMesh, subMesh: BABYLON.SubMesh, useInstances?: boolean): boolean;
        bindForSubMesh(world: BABYLON.Matrix, mesh: BABYLON.Mesh, subMesh: BABYLON.SubMesh): void;
        getAnimatables(): BABYLON.IAnimatable[];
        getActiveTextures(): BABYLON.BaseTexture[];
        hasTexture(texture: BABYLON.BaseTexture): boolean;
        dispose(forceDisposeEffect?: boolean): void;
        clone(name: string): TerrainMaterial;
        serialize(): any;
        getClassName(): string;
        static Parse(source: any, scene: BABYLON.Scene, rootUrl: string): TerrainMaterial;
    }
}
declare module BABYLON {
    export class TriPlanarMaterial extends BABYLON.PushMaterial {
        mixTexture: BABYLON.BaseTexture;
        diffuseTextureX: BABYLON.BaseTexture;
        diffuseTextureY: BABYLON.BaseTexture;
        diffuseTextureZ: BABYLON.BaseTexture;
        normalTextureX: BABYLON.BaseTexture;
        normalTextureY: BABYLON.BaseTexture;
        normalTextureZ: BABYLON.BaseTexture;
        tileSize: number;
        diffuseColor: BABYLON.Color3;
        specularColor: BABYLON.Color3;
        specularPower: number;
        disableLighting: boolean;
        maxSimultaneousLights: number;
        constructor(name: string, scene: BABYLON.Scene);
        needAlphaBlending(): boolean;
        needAlphaTesting(): boolean;
        getAlphaTestTexture(): BABYLON.Nullable<BABYLON.BaseTexture>;
        isReadyForSubMesh(mesh: BABYLON.AbstractMesh, subMesh: BABYLON.SubMesh, useInstances?: boolean): boolean;
        bindForSubMesh(world: BABYLON.Matrix, mesh: BABYLON.Mesh, subMesh: BABYLON.SubMesh): void;
        getAnimatables(): BABYLON.IAnimatable[];
        getActiveTextures(): BABYLON.BaseTexture[];
        hasTexture(texture: BABYLON.BaseTexture): boolean;
        dispose(forceDisposeEffect?: boolean): void;
        clone(name: string): TriPlanarMaterial;
        serialize(): any;
        getClassName(): string;
        static Parse(source: any, scene: BABYLON.Scene, rootUrl: string): TriPlanarMaterial;
    }
}
declare module BABYLON {
    export class WaterMaterial extends BABYLON.PushMaterial {
            renderTargetSize: BABYLON.Vector2;
            bumpTexture: BABYLON.BaseTexture;
            diffuseColor: BABYLON.Color3;
            specularColor: BABYLON.Color3;
            specularPower: number;
            disableLighting: boolean;
            maxSimultaneousLights: number;
            /**
             * @param {number}: Represents the wind force
             */
            windForce: number;
            /**
             * @param {Vector2}: The direction of the wind in the plane (X, Z)
             */
            windDirection: BABYLON.Vector2;
            /**
             * @param {number}: Wave height, represents the height of the waves
             */
            waveHeight: number;
            /**
             * @param {number}: Bump height, represents the bump height related to the bump map
             */
            bumpHeight: number;
            bumpSuperimpose: boolean;
            fresnelSeparate: boolean;
            bumpAffectsReflection: boolean;
            /**
             * @param {number}: The water color blended with the refraction (near)
             */
            waterColor: BABYLON.Color3;
            /**
             * @param {number}: The blend factor related to the water color
             */
            colorBlendFactor: number;
            /**
                * @param {number}: The water color blended with the reflection (far)
                */
            waterColor2: BABYLON.Color3;
            /**
                * @param {number}: The blend factor related to the water color (reflection, far)
                */
            colorBlendFactor2: number;
            /**
             * @param {number}: Represents the maximum length of a wave
             */
            waveLength: number;
            /**
             * @param {number}: Defines the waves speed
             */
            waveSpeed: number;
            protected _renderTargets: BABYLON.SmartArray<BABYLON.RenderTargetTexture>;
            /**
                * Gets a boolean indicating that current material needs to register RTT
                */
            readonly hasRenderTargetTextures: boolean;
            /**
             * Constructor
             */
            constructor(name: string, scene: BABYLON.Scene, renderTargetSize?: BABYLON.Vector2);
            useLogarithmicDepth: boolean;
            readonly refractionTexture: BABYLON.Nullable<BABYLON.RenderTargetTexture>;
            readonly reflectionTexture: BABYLON.Nullable<BABYLON.RenderTargetTexture>;
            addToRenderList(node: any): void;
            enableRenderTargets(enable: boolean): void;
            getRenderList(): BABYLON.Nullable<BABYLON.AbstractMesh[]>;
            readonly renderTargetsEnabled: boolean;
            needAlphaBlending(): boolean;
            needAlphaTesting(): boolean;
            getAlphaTestTexture(): BABYLON.Nullable<BABYLON.BaseTexture>;
            isReadyForSubMesh(mesh: BABYLON.AbstractMesh, subMesh: BABYLON.SubMesh, useInstances?: boolean): boolean;
            bindForSubMesh(world: BABYLON.Matrix, mesh: BABYLON.Mesh, subMesh: BABYLON.SubMesh): void;
            getAnimatables(): BABYLON.IAnimatable[];
            getActiveTextures(): BABYLON.BaseTexture[];
            hasTexture(texture: BABYLON.BaseTexture): boolean;
            dispose(forceDisposeEffect?: boolean): void;
            clone(name: string): WaterMaterial;
            serialize(): any;
            getClassName(): string;
            static Parse(source: any, scene: BABYLON.Scene, rootUrl: string): WaterMaterial;
            static CreateDefaultMesh(name: string, scene: BABYLON.Scene): BABYLON.Mesh;
    }
}