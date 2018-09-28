/*BabylonJS Materials*/
// Dependencies for this module:
//   ../../../../Tools/Gulp/babylonjs

declare module 'babylonjs-materials' {
    export * from "babylonjs-materials/src/cell";
    export * from "babylonjs-materials/src/custom";
    export * from "babylonjs-materials/src/fire";
    export * from "babylonjs-materials/src/fur";
    export * from "babylonjs-materials/src/gradient";
    export * from "babylonjs-materials/src/grid";
    export * from "babylonjs-materials/src/lava";
    export * from "babylonjs-materials/src/mix";
    export * from "babylonjs-materials/src/normal";
    export * from "babylonjs-materials/src/shadowOnly";
    export * from "babylonjs-materials/src/simple";
    export * from "babylonjs-materials/src/sky";
    export * from "babylonjs-materials/src/terrain";
    export * from "babylonjs-materials/src/triPlanar";
    export * from "babylonjs-materials/src/water";
}

declare module 'babylonjs-materials/src/cell' {
    export * from "babylonjs-materials/src/cell/cellMaterial";
}

declare module 'babylonjs-materials/src/custom' {
    export * from "babylonjs-materials/src/custom/customMaterial";
}

declare module 'babylonjs-materials/src/fire' {
    export * from "babylonjs-materials/src/fire/fireMaterial";
}

declare module 'babylonjs-materials/src/fur' {
    export * from "babylonjs-materials/src/fur/furMaterial";
}

declare module 'babylonjs-materials/src/gradient' {
    export * from "babylonjs-materials/src/gradient/gradientMaterial";
}

declare module 'babylonjs-materials/src/grid' {
    export * from "babylonjs-materials/src/grid/gridMaterial";
}

declare module 'babylonjs-materials/src/lava' {
    export * from "babylonjs-materials/src/lava/lavaMaterial";
}

declare module 'babylonjs-materials/src/mix' {
    export * from "babylonjs-materials/src/mix/mixMaterial";
}

declare module 'babylonjs-materials/src/normal' {
    export * from "babylonjs-materials/src/normal/normalMaterial";
}

declare module 'babylonjs-materials/src/shadowOnly' {
    export * from "babylonjs-materials/src/shadowOnly/shadowOnlyMaterial";
}

declare module 'babylonjs-materials/src/simple' {
    export * from "babylonjs-materials/src/simple/simpleMaterial";
}

declare module 'babylonjs-materials/src/sky' {
    export * from "babylonjs-materials/src/sky/skyMaterial";
}

declare module 'babylonjs-materials/src/terrain' {
    export * from "babylonjs-materials/src/terrain/terrainMaterial";
}

declare module 'babylonjs-materials/src/triPlanar' {
    export * from "babylonjs-materials/src/triPlanar/triPlanarMaterial";
}

declare module 'babylonjs-materials/src/water' {
    export * from "babylonjs-materials/src/water/waterMaterial";
}

declare module 'babylonjs-materials/src/cell/cellMaterial' {
    import { PushMaterial, BaseTexture, Scene, Color3, AbstractMesh, Nullable, SubMesh, Matrix, Mesh, IAnimatable } from "babylonjs";
    export class CellMaterial extends PushMaterial {
        diffuseTexture: BaseTexture;
        diffuseColor: Color3;
        _computeHighLevel: boolean;
        computeHighLevel: boolean;
        disableLighting: boolean;
        maxSimultaneousLights: number;
        constructor(name: string, scene: Scene);
        needAlphaBlending(): boolean;
        needAlphaTesting(): boolean;
        getAlphaTestTexture(): Nullable<BaseTexture>;
        isReadyForSubMesh(mesh: AbstractMesh, subMesh: SubMesh, useInstances?: boolean): boolean;
        bindForSubMesh(world: Matrix, mesh: Mesh, subMesh: SubMesh): void;
        getAnimatables(): IAnimatable[];
        getActiveTextures(): BaseTexture[];
        hasTexture(texture: BaseTexture): boolean;
        dispose(forceDisposeEffect?: boolean): void;
        getClassName(): string;
        clone(name: string): CellMaterial;
        serialize(): any;
        static Parse(source: any, scene: Scene, rootUrl: string): CellMaterial;
    }
}

declare module 'babylonjs-materials/src/custom/customMaterial' {
    import { StandardMaterial, Texture, Mesh, Effect, StandardMaterialDefines, Scene } from "babylonjs";
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
    export class CustomMaterial extends StandardMaterial {
        static ShaderIndexer: number;
        CustomParts: ShaderSpecialParts;
        _isCreatedShader: boolean;
        _createdShaderName: string;
        _customUniform: string[];
        _newUniforms: string[];
        _newUniformInstances: any[];
        _newSamplerInstances: Texture[];
        FragmentShader: string;
        VertexShader: string;
        AttachAfterBind(mesh: Mesh, effect: Effect): void;
        ReviewUniform(name: string, arr: string[]): string[];
        Builder(shaderName: string, uniforms: string[], uniformBuffers: string[], samplers: string[], defines: StandardMaterialDefines): string;
        constructor(name: string, scene: Scene);
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

declare module 'babylonjs-materials/src/fire/fireMaterial' {
    import { PushMaterial, Nullable, BaseTexture, Color3, Scene, AbstractMesh, SubMesh, Matrix, Mesh, IAnimatable } from "babylonjs";
    export class FireMaterial extends PushMaterial {
        diffuseTexture: Nullable<BaseTexture>;
        distortionTexture: Nullable<BaseTexture>;
        opacityTexture: Nullable<BaseTexture>;
        diffuseColor: Color3;
        speed: number;
        constructor(name: string, scene: Scene);
        needAlphaBlending(): boolean;
        needAlphaTesting(): boolean;
        getAlphaTestTexture(): Nullable<BaseTexture>;
        isReadyForSubMesh(mesh: AbstractMesh, subMesh: SubMesh, useInstances?: boolean): boolean;
        bindForSubMesh(world: Matrix, mesh: Mesh, subMesh: SubMesh): void;
        getAnimatables(): IAnimatable[];
        getActiveTextures(): BaseTexture[];
        hasTexture(texture: BaseTexture): boolean;
        getClassName(): string;
        dispose(forceDisposeEffect?: boolean): void;
        clone(name: string): FireMaterial;
        serialize(): any;
        static Parse(source: any, scene: Scene, rootUrl: string): FireMaterial;
    }
}

declare module 'babylonjs-materials/src/fur/furMaterial' {
    import { PushMaterial, BaseTexture, Color3, Vector3, DynamicTexture, AbstractMesh, Scene, Nullable, SubMesh, Matrix, Mesh, IAnimatable } from "babylonjs";
    export class FurMaterial extends PushMaterial {
        diffuseTexture: BaseTexture;
        heightTexture: BaseTexture;
        diffuseColor: Color3;
        furLength: number;
        furAngle: number;
        furColor: Color3;
        furOffset: number;
        furSpacing: number;
        furGravity: Vector3;
        furSpeed: number;
        furDensity: number;
        furOcclusion: number;
        furTexture: DynamicTexture;
        disableLighting: boolean;
        maxSimultaneousLights: number;
        highLevelFur: boolean;
        _meshes: AbstractMesh[];
        constructor(name: string, scene: Scene);
        furTime: number;
        needAlphaBlending(): boolean;
        needAlphaTesting(): boolean;
        getAlphaTestTexture(): Nullable<BaseTexture>;
        updateFur(): void;
        isReadyForSubMesh(mesh: AbstractMesh, subMesh: SubMesh, useInstances?: boolean): boolean;
        bindForSubMesh(world: Matrix, mesh: Mesh, subMesh: SubMesh): void;
        getAnimatables(): IAnimatable[];
        getActiveTextures(): BaseTexture[];
        hasTexture(texture: BaseTexture): boolean;
        dispose(forceDisposeEffect?: boolean): void;
        clone(name: string): FurMaterial;
        serialize(): any;
        getClassName(): string;
        static Parse(source: any, scene: Scene, rootUrl: string): FurMaterial;
        static GenerateTexture(name: string, scene: Scene): DynamicTexture;
        static FurifyMesh(sourceMesh: Mesh, quality: number): Mesh[];
    }
}

declare module 'babylonjs-materials/src/gradient/gradientMaterial' {
    import { PushMaterial, Color3, Scene, Nullable, BaseTexture, AbstractMesh, SubMesh, Matrix, Mesh, IAnimatable } from "babylonjs";
    export class GradientMaterial extends PushMaterial {
        maxSimultaneousLights: number;
        topColor: Color3;
        topColorAlpha: number;
        bottomColor: Color3;
        bottomColorAlpha: number;
        offset: number;
        scale: number;
        smoothness: number;
        disableLighting: boolean;
        constructor(name: string, scene: Scene);
        needAlphaBlending(): boolean;
        needAlphaTesting(): boolean;
        getAlphaTestTexture(): Nullable<BaseTexture>;
        isReadyForSubMesh(mesh: AbstractMesh, subMesh: SubMesh, useInstances?: boolean): boolean;
        bindForSubMesh(world: Matrix, mesh: Mesh, subMesh: SubMesh): void;
        getAnimatables(): IAnimatable[];
        dispose(forceDisposeEffect?: boolean): void;
        clone(name: string): GradientMaterial;
        serialize(): any;
        getClassName(): string;
        static Parse(source: any, scene: Scene, rootUrl: string): GradientMaterial;
    }
}

declare module 'babylonjs-materials/src/grid/gridMaterial' {
    import { Color3, Vector3, Scene, AbstractMesh, SubMesh, Matrix, Mesh } from "babylonjs";
    /**
        * The grid materials allows you to wrap any shape with a grid.
        * Colors are customizable.
        */
    export class GridMaterial extends BABYLON.PushMaterial {
            /**
                * Main color of the grid (e.g. between lines)
                */
            mainColor: Color3;
            /**
                * Color of the grid lines.
                */
            lineColor: Color3;
            /**
                * The scale of the grid compared to unit.
                */
            gridRatio: number;
            /**
                * Allows setting an offset for the grid lines.
                */
            gridOffset: Vector3;
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
            constructor(name: string, scene: Scene);
            /**
                * Returns wehter or not the grid requires alpha blending.
                */
            needAlphaBlending(): boolean;
            needAlphaBlendingForMesh(mesh: AbstractMesh): boolean;
            isReadyForSubMesh(mesh: AbstractMesh, subMesh: SubMesh, useInstances?: boolean): boolean;
            bindForSubMesh(world: Matrix, mesh: Mesh, subMesh: SubMesh): void;
            dispose(forceDisposeEffect?: boolean): void;
            clone(name: string): GridMaterial;
            serialize(): any;
            getClassName(): string;
            static Parse(source: any, scene: Scene, rootUrl: string): GridMaterial;
    }
}

declare module 'babylonjs-materials/src/lava/lavaMaterial' {
    import { PushMaterial, BaseTexture, Color3, Scene, Nullable, AbstractMesh, SubMesh, Matrix, Mesh, IAnimatable } from "babylonjs";
    export class LavaMaterial extends PushMaterial {
        diffuseTexture: BaseTexture;
        noiseTexture: BaseTexture;
        fogColor: Color3;
        speed: number;
        movingSpeed: number;
        lowFrequencySpeed: number;
        fogDensity: number;
        diffuseColor: Color3;
        disableLighting: boolean;
        unlit: boolean;
        maxSimultaneousLights: number;
        constructor(name: string, scene: Scene);
        needAlphaBlending(): boolean;
        needAlphaTesting(): boolean;
        getAlphaTestTexture(): Nullable<BaseTexture>;
        isReadyForSubMesh(mesh: AbstractMesh, subMesh: SubMesh, useInstances?: boolean): boolean;
        bindForSubMesh(world: Matrix, mesh: Mesh, subMesh: SubMesh): void;
        getAnimatables(): IAnimatable[];
        getActiveTextures(): BaseTexture[];
        hasTexture(texture: BaseTexture): boolean;
        dispose(forceDisposeEffect?: boolean): void;
        clone(name: string): LavaMaterial;
        serialize(): any;
        getClassName(): string;
        static Parse(source: any, scene: Scene, rootUrl: string): LavaMaterial;
    }
}

declare module 'babylonjs-materials/src/mix/mixMaterial' {
    import { PushMaterial, BaseTexture, Texture, Color3, Scene, Nullable, AbstractMesh, SubMesh, Matrix, Mesh, IAnimatable } from "babylonjs";
    export class MixMaterial extends PushMaterial {
            mixTexture1: BaseTexture;
            mixTexture2: BaseTexture;
            diffuseTexture1: Texture;
            diffuseTexture2: Texture;
            diffuseTexture3: Texture;
            diffuseTexture4: Texture;
            diffuseTexture5: Texture;
            diffuseTexture6: Texture;
            diffuseTexture7: Texture;
            diffuseTexture8: Texture;
            /**
                * Uniforms
                */
            diffuseColor: Color3;
            specularColor: Color3;
            specularPower: number;
            disableLighting: boolean;
            maxSimultaneousLights: number;
            constructor(name: string, scene: Scene);
            needAlphaBlending(): boolean;
            needAlphaTesting(): boolean;
            getAlphaTestTexture(): Nullable<BaseTexture>;
            isReadyForSubMesh(mesh: AbstractMesh, subMesh: SubMesh, useInstances?: boolean): boolean;
            bindForSubMesh(world: Matrix, mesh: Mesh, subMesh: SubMesh): void;
            getAnimatables(): IAnimatable[];
            getActiveTextures(): BaseTexture[];
            hasTexture(texture: BaseTexture): boolean;
            dispose(forceDisposeEffect?: boolean): void;
            clone(name: string): MixMaterial;
            serialize(): any;
            getClassName(): string;
            static Parse(source: any, scene: Scene, rootUrl: string): MixMaterial;
    }
}

declare module 'babylonjs-materials/src/normal/normalMaterial' {
    import { PushMaterial, BaseTexture, Color3, Scene, Nullable, AbstractMesh, SubMesh, Matrix, Mesh, IAnimatable } from "babylonjs";
    export class NormalMaterial extends PushMaterial {
        diffuseTexture: BaseTexture;
        diffuseColor: Color3;
        disableLighting: boolean;
        maxSimultaneousLights: number;
        constructor(name: string, scene: Scene);
        needAlphaBlending(): boolean;
        needAlphaTesting(): boolean;
        getAlphaTestTexture(): Nullable<BaseTexture>;
        isReadyForSubMesh(mesh: AbstractMesh, subMesh: SubMesh, useInstances?: boolean): boolean;
        bindForSubMesh(world: Matrix, mesh: Mesh, subMesh: SubMesh): void;
        getAnimatables(): IAnimatable[];
        getActiveTextures(): BaseTexture[];
        hasTexture(texture: BaseTexture): boolean;
        dispose(forceDisposeEffect?: boolean): void;
        clone(name: string): NormalMaterial;
        serialize(): any;
        getClassName(): string;
        static Parse(source: any, scene: Scene, rootUrl: string): NormalMaterial;
    }
}

declare module 'babylonjs-materials/src/shadowOnly/shadowOnlyMaterial' {
    import { PushMaterial, IShadowLight, Scene, Nullable, BaseTexture, AbstractMesh, SubMesh, Matrix, Mesh } from "babylonjs";
    export class ShadowOnlyMaterial extends PushMaterial {
        constructor(name: string, scene: Scene);
        shadowColor: BABYLON.Color3;
        needAlphaBlending(): boolean;
        needAlphaTesting(): boolean;
        getAlphaTestTexture(): Nullable<BaseTexture>;
        activeLight: IShadowLight;
        isReadyForSubMesh(mesh: AbstractMesh, subMesh: SubMesh, useInstances?: boolean): boolean;
        bindForSubMesh(world: Matrix, mesh: Mesh, subMesh: SubMesh): void;
        clone(name: string): ShadowOnlyMaterial;
        serialize(): any;
        getClassName(): string;
        static Parse(source: any, scene: Scene, rootUrl: string): ShadowOnlyMaterial;
    }
}

declare module 'babylonjs-materials/src/simple/simpleMaterial' {
    import { PushMaterial, BaseTexture, Color3, Scene, Nullable, AbstractMesh, SubMesh, Matrix, Mesh, IAnimatable } from "babylonjs";
    export class SimpleMaterial extends PushMaterial {
        diffuseTexture: BaseTexture;
        diffuseColor: Color3;
        disableLighting: boolean;
        maxSimultaneousLights: number;
        constructor(name: string, scene: Scene);
        needAlphaBlending(): boolean;
        needAlphaTesting(): boolean;
        getAlphaTestTexture(): Nullable<BaseTexture>;
        isReadyForSubMesh(mesh: AbstractMesh, subMesh: SubMesh, useInstances?: boolean): boolean;
        bindForSubMesh(world: Matrix, mesh: Mesh, subMesh: SubMesh): void;
        getAnimatables(): IAnimatable[];
        getActiveTextures(): BaseTexture[];
        hasTexture(texture: BaseTexture): boolean;
        dispose(forceDisposeEffect?: boolean): void;
        clone(name: string): SimpleMaterial;
        serialize(): any;
        getClassName(): string;
        static Parse(source: any, scene: Scene, rootUrl: string): SimpleMaterial;
    }
}

declare module 'babylonjs-materials/src/sky/skyMaterial' {
    import { PushMaterial, Vector3, Scene, Nullable, BaseTexture, AbstractMesh, SubMesh, Matrix, Mesh, IAnimatable } from "babylonjs";
    export class SkyMaterial extends PushMaterial {
        luminance: number;
        turbidity: number;
        rayleigh: number;
        mieCoefficient: number;
        mieDirectionalG: number;
        distance: number;
        inclination: number;
        azimuth: number;
        sunPosition: Vector3;
        useSunPosition: boolean;
        constructor(name: string, scene: Scene);
        needAlphaBlending(): boolean;
        needAlphaTesting(): boolean;
        getAlphaTestTexture(): Nullable<BaseTexture>;
        isReadyForSubMesh(mesh: AbstractMesh, subMesh: SubMesh, useInstances?: boolean): boolean;
        bindForSubMesh(world: Matrix, mesh: Mesh, subMesh: SubMesh): void;
        getAnimatables(): IAnimatable[];
        dispose(forceDisposeEffect?: boolean): void;
        clone(name: string): SkyMaterial;
        serialize(): any;
        getClassName(): string;
        static Parse(source: any, scene: Scene, rootUrl: string): SkyMaterial;
    }
}

declare module 'babylonjs-materials/src/terrain/terrainMaterial' {
    import { PushMaterial, BaseTexture, Texture, Color3, Scene, Nullable, AbstractMesh, SubMesh, Matrix, Mesh, IAnimatable } from "babylonjs";
    export class TerrainMaterial extends PushMaterial {
        mixTexture: BaseTexture;
        diffuseTexture1: Texture;
        diffuseTexture2: Texture;
        diffuseTexture3: Texture;
        bumpTexture1: Texture;
        bumpTexture2: Texture;
        bumpTexture3: Texture;
        diffuseColor: Color3;
        specularColor: Color3;
        specularPower: number;
        disableLighting: boolean;
        maxSimultaneousLights: number;
        constructor(name: string, scene: Scene);
        needAlphaBlending(): boolean;
        needAlphaTesting(): boolean;
        getAlphaTestTexture(): Nullable<BaseTexture>;
        isReadyForSubMesh(mesh: AbstractMesh, subMesh: SubMesh, useInstances?: boolean): boolean;
        bindForSubMesh(world: Matrix, mesh: Mesh, subMesh: SubMesh): void;
        getAnimatables(): IAnimatable[];
        getActiveTextures(): BaseTexture[];
        hasTexture(texture: BaseTexture): boolean;
        dispose(forceDisposeEffect?: boolean): void;
        clone(name: string): TerrainMaterial;
        serialize(): any;
        getClassName(): string;
        static Parse(source: any, scene: Scene, rootUrl: string): TerrainMaterial;
    }
}

declare module 'babylonjs-materials/src/triPlanar/triPlanarMaterial' {
    import { PushMaterial, BaseTexture, Color3, Scene, Nullable, AbstractMesh, SubMesh, Matrix, Mesh, IAnimatable } from "babylonjs";
    export class TriPlanarMaterial extends PushMaterial {
        mixTexture: BaseTexture;
        diffuseTextureX: BaseTexture;
        diffuseTextureY: BaseTexture;
        diffuseTextureZ: BaseTexture;
        normalTextureX: BaseTexture;
        normalTextureY: BaseTexture;
        normalTextureZ: BaseTexture;
        tileSize: number;
        diffuseColor: Color3;
        specularColor: Color3;
        specularPower: number;
        disableLighting: boolean;
        maxSimultaneousLights: number;
        constructor(name: string, scene: Scene);
        needAlphaBlending(): boolean;
        needAlphaTesting(): boolean;
        getAlphaTestTexture(): Nullable<BaseTexture>;
        isReadyForSubMesh(mesh: AbstractMesh, subMesh: SubMesh, useInstances?: boolean): boolean;
        bindForSubMesh(world: Matrix, mesh: Mesh, subMesh: SubMesh): void;
        getAnimatables(): IAnimatable[];
        getActiveTextures(): BaseTexture[];
        hasTexture(texture: BaseTexture): boolean;
        dispose(forceDisposeEffect?: boolean): void;
        clone(name: string): TriPlanarMaterial;
        serialize(): any;
        getClassName(): string;
        static Parse(source: any, scene: Scene, rootUrl: string): TriPlanarMaterial;
    }
}

declare module 'babylonjs-materials/src/water/waterMaterial' {
    import { PushMaterial, BaseTexture, Color3, Vector2, SmartArray, RenderTargetTexture, Nullable, AbstractMesh, Matrix, Scene, SubMesh, Mesh, IAnimatable } from "babylonjs";
    export class WaterMaterial extends PushMaterial {
            renderTargetSize: Vector2;
            bumpTexture: BaseTexture;
            diffuseColor: Color3;
            specularColor: Color3;
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
            windDirection: Vector2;
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
            waterColor: Color3;
            /**
             * @param {number}: The blend factor related to the water color
             */
            colorBlendFactor: number;
            /**
                * @param {number}: The water color blended with the reflection (far)
                */
            waterColor2: Color3;
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
            protected _renderTargets: SmartArray<RenderTargetTexture>;
            /**
                * Gets a boolean indicating that current material needs to register RTT
                */
            readonly hasRenderTargetTextures: boolean;
            /**
             * Constructor
             */
            constructor(name: string, scene: Scene, renderTargetSize?: Vector2);
            useLogarithmicDepth: boolean;
            readonly refractionTexture: Nullable<RenderTargetTexture>;
            readonly reflectionTexture: Nullable<RenderTargetTexture>;
            addToRenderList(node: any): void;
            enableRenderTargets(enable: boolean): void;
            getRenderList(): Nullable<AbstractMesh[]>;
            readonly renderTargetsEnabled: boolean;
            needAlphaBlending(): boolean;
            needAlphaTesting(): boolean;
            getAlphaTestTexture(): Nullable<BaseTexture>;
            isReadyForSubMesh(mesh: AbstractMesh, subMesh: SubMesh, useInstances?: boolean): boolean;
            bindForSubMesh(world: Matrix, mesh: Mesh, subMesh: SubMesh): void;
            getAnimatables(): IAnimatable[];
            getActiveTextures(): BaseTexture[];
            hasTexture(texture: BaseTexture): boolean;
            dispose(forceDisposeEffect?: boolean): void;
            clone(name: string): WaterMaterial;
            serialize(): any;
            getClassName(): string;
            static Parse(source: any, scene: Scene, rootUrl: string): WaterMaterial;
            static CreateDefaultMesh(name: string, scene: Scene): Mesh;
    }
}


/*BabylonJS Materials*/
// Dependencies for this module:
//   ../../../../Tools/Gulp/babylonjs
declare module BABYLON {
}
declare module BABYLON {
}
declare module BABYLON {
}
declare module BABYLON {
}
declare module BABYLON {
}
declare module BABYLON {
}
declare module BABYLON {
}
declare module BABYLON {
}
declare module BABYLON {
}
declare module BABYLON {
}
declare module BABYLON {
}
declare module BABYLON {
}
declare module BABYLON {
}
declare module BABYLON {
}
declare module BABYLON {
}
declare module BABYLON {
}
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