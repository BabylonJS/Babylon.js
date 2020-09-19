declare module "babylonjs-materials/cell/cell.fragment" {
    import "babylonjs/Shaders/ShadersInclude/helperFunctions";
    import "babylonjs/Shaders/ShadersInclude/lightFragmentDeclaration";
    import "babylonjs/Shaders/ShadersInclude/lightUboDeclaration";
    import "babylonjs/Shaders/ShadersInclude/lightsFragmentFunctions";
    import "babylonjs/Shaders/ShadersInclude/shadowsFragmentFunctions";
    import "babylonjs/Shaders/ShadersInclude/clipPlaneFragmentDeclaration";
    import "babylonjs/Shaders/ShadersInclude/fogFragmentDeclaration";
    import "babylonjs/Shaders/ShadersInclude/clipPlaneFragment";
    import "babylonjs/Shaders/ShadersInclude/depthPrePass";
    import "babylonjs/Shaders/ShadersInclude/lightFragment";
    import "babylonjs/Shaders/ShadersInclude/fogFragment";
    /** @hidden */
    export var cellPixelShader: {
        name: string;
        shader: string;
    };
}
declare module "babylonjs-materials/cell/cell.vertex" {
    import "babylonjs/Shaders/ShadersInclude/bonesDeclaration";
    import "babylonjs/Shaders/ShadersInclude/instancesDeclaration";
    import "babylonjs/Shaders/ShadersInclude/clipPlaneVertexDeclaration";
    import "babylonjs/Shaders/ShadersInclude/fogVertexDeclaration";
    import "babylonjs/Shaders/ShadersInclude/lightFragmentDeclaration";
    import "babylonjs/Shaders/ShadersInclude/lightUboDeclaration";
    import "babylonjs/Shaders/ShadersInclude/instancesVertex";
    import "babylonjs/Shaders/ShadersInclude/bonesVertex";
    import "babylonjs/Shaders/ShadersInclude/clipPlaneVertex";
    import "babylonjs/Shaders/ShadersInclude/fogVertex";
    import "babylonjs/Shaders/ShadersInclude/shadowsVertex";
    /** @hidden */
    export var cellVertexShader: {
        name: string;
        shader: string;
    };
}
declare module "babylonjs-materials/cell/cellMaterial" {
    import { Nullable } from "babylonjs/types";
    import { Color3, Matrix } from "babylonjs/Maths/math";
    import { IAnimatable } from "babylonjs/Misc/tools";
    import { BaseTexture } from "babylonjs/Materials/Textures/baseTexture";
    import { PushMaterial } from "babylonjs/Materials/pushMaterial";
    import { AbstractMesh } from "babylonjs/Meshes/abstractMesh";
    import { SubMesh } from "babylonjs/Meshes/subMesh";
    import { Mesh } from "babylonjs/Meshes/mesh";
    import { Scene } from "babylonjs/scene";
    import "babylonjs-materials/cell/cell.fragment";
    import "babylonjs-materials/cell/cell.vertex";
    export class CellMaterial extends PushMaterial {
        private _diffuseTexture;
        diffuseTexture: BaseTexture;
        diffuseColor: Color3;
        _computeHighLevel: boolean;
        computeHighLevel: boolean;
        private _disableLighting;
        disableLighting: boolean;
        private _maxSimultaneousLights;
        maxSimultaneousLights: number;
        private _renderId;
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
declare module "babylonjs-materials/cell/index" {
    export * from "babylonjs-materials/cell/cellMaterial";
}
declare module "babylonjs-materials/custom/customMaterial" {
    import { Texture } from "babylonjs/Materials/Textures/texture";
    import { Effect } from "babylonjs/Materials/effect";
    import { StandardMaterialDefines } from "babylonjs/Materials/standardMaterial";
    import { StandardMaterial } from "babylonjs/Materials/standardMaterial";
    import { Mesh } from "babylonjs/Meshes/mesh";
    import { Scene } from "babylonjs/scene";
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
        Fragment_Before_Lights: string;
        Fragment_Before_Fog: string;
        Fragment_Custom_Alpha: string;
        Fragment_Before_FragColor: string;
        Vertex_Begin: string;
        Vertex_Definitions: string;
        Vertex_MainBegin: string;
        Vertex_Before_PositionUpdated: string;
        Vertex_Before_NormalUpdated: string;
        Vertex_MainEnd: string;
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
        Fragment_Before_Lights(shaderPart: string): CustomMaterial;
        Fragment_Before_Fog(shaderPart: string): CustomMaterial;
        Fragment_Before_FragColor(shaderPart: string): CustomMaterial;
        Vertex_Begin(shaderPart: string): CustomMaterial;
        Vertex_Definitions(shaderPart: string): CustomMaterial;
        Vertex_MainBegin(shaderPart: string): CustomMaterial;
        Vertex_Before_PositionUpdated(shaderPart: string): CustomMaterial;
        Vertex_Before_NormalUpdated(shaderPart: string): CustomMaterial;
        Vertex_MainEnd(shaderPart: string): CustomMaterial;
    }
}
declare module "babylonjs-materials/custom/pbrCustomMaterial" {
    import { Texture } from "babylonjs/Materials/Textures/texture";
    import { Effect } from "babylonjs/Materials/effect";
    import { PBRMaterialDefines } from "babylonjs/Materials/PBR/pbrBaseMaterial";
    import { PBRMaterial } from "babylonjs/Materials/PBR/pbrMaterial";
    import { Mesh } from "babylonjs/Meshes/mesh";
    import { Scene } from "babylonjs/scene";
    export class ShaderAlebdoParts {
        constructor();
        Fragment_Begin: string;
        Fragment_Definitions: string;
        Fragment_MainBegin: string;
        Fragment_Custom_Albedo: string;
        Fragment_Before_Lights: string;
        Fragment_Custom_MetallicRoughness: string;
        Fragment_Custom_MicroSurface: string;
        Fragment_Before_Fog: string;
        Fragment_Custom_Alpha: string;
        Fragment_Before_FragColor: string;
        Vertex_Begin: string;
        Vertex_Definitions: string;
        Vertex_MainBegin: string;
        Vertex_Before_PositionUpdated: string;
        Vertex_Before_NormalUpdated: string;
        Vertex_MainEnd: string;
    }
    export class PBRCustomMaterial extends PBRMaterial {
        static ShaderIndexer: number;
        CustomParts: ShaderAlebdoParts;
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
        Builder(shaderName: string, uniforms: string[], uniformBuffers: string[], samplers: string[], defines: PBRMaterialDefines): string;
        constructor(name: string, scene: Scene);
        AddUniform(name: string, kind: string, param: any): PBRCustomMaterial;
        Fragment_Begin(shaderPart: string): PBRCustomMaterial;
        Fragment_Definitions(shaderPart: string): PBRCustomMaterial;
        Fragment_MainBegin(shaderPart: string): PBRCustomMaterial;
        Fragment_Custom_Albedo(shaderPart: string): PBRCustomMaterial;
        Fragment_Custom_Alpha(shaderPart: string): PBRCustomMaterial;
        Fragment_Before_Lights(shaderPart: string): PBRCustomMaterial;
        Fragment_Custom_MetallicRoughness(shaderPart: string): PBRCustomMaterial;
        Fragment_Custom_MicroSurface(shaderPart: string): PBRCustomMaterial;
        Fragment_Before_Fog(shaderPart: string): PBRCustomMaterial;
        Fragment_Before_FragColor(shaderPart: string): PBRCustomMaterial;
        Vertex_Begin(shaderPart: string): PBRCustomMaterial;
        Vertex_Definitions(shaderPart: string): PBRCustomMaterial;
        Vertex_MainBegin(shaderPart: string): PBRCustomMaterial;
        Vertex_Before_PositionUpdated(shaderPart: string): PBRCustomMaterial;
        Vertex_Before_NormalUpdated(shaderPart: string): PBRCustomMaterial;
        Vertex_MainEnd(shaderPart: string): PBRCustomMaterial;
    }
}
declare module "babylonjs-materials/custom/index" {
    export * from "babylonjs-materials/custom/customMaterial";
    export * from "babylonjs-materials/custom/pbrCustomMaterial";
}
declare module "babylonjs-materials/fire/fire.fragment" {
    import "babylonjs/Shaders/ShadersInclude/clipPlaneFragmentDeclaration";
    import "babylonjs/Shaders/ShadersInclude/fogFragmentDeclaration";
    import "babylonjs/Shaders/ShadersInclude/clipPlaneFragment";
    import "babylonjs/Shaders/ShadersInclude/depthPrePass";
    import "babylonjs/Shaders/ShadersInclude/fogFragment";
    /** @hidden */
    export var firePixelShader: {
        name: string;
        shader: string;
    };
}
declare module "babylonjs-materials/fire/fire.vertex" {
    import "babylonjs/Shaders/ShadersInclude/bonesDeclaration";
    import "babylonjs/Shaders/ShadersInclude/instancesDeclaration";
    import "babylonjs/Shaders/ShadersInclude/clipPlaneVertexDeclaration";
    import "babylonjs/Shaders/ShadersInclude/fogVertexDeclaration";
    import "babylonjs/Shaders/ShadersInclude/instancesVertex";
    import "babylonjs/Shaders/ShadersInclude/bonesVertex";
    import "babylonjs/Shaders/ShadersInclude/clipPlaneVertex";
    import "babylonjs/Shaders/ShadersInclude/fogVertex";
    /** @hidden */
    export var fireVertexShader: {
        name: string;
        shader: string;
    };
}
declare module "babylonjs-materials/fire/fireMaterial" {
    import { Nullable } from "babylonjs/types";
    import { Color3, Matrix } from "babylonjs/Maths/math";
    import { IAnimatable } from "babylonjs/Misc/tools";
    import { BaseTexture } from "babylonjs/Materials/Textures/baseTexture";
    import { PushMaterial } from "babylonjs/Materials/pushMaterial";
    import { AbstractMesh } from "babylonjs/Meshes/abstractMesh";
    import { SubMesh } from "babylonjs/Meshes/subMesh";
    import { Mesh } from "babylonjs/Meshes/mesh";
    import { Scene } from "babylonjs/scene";
    import "babylonjs-materials/fire/fire.fragment";
    import "babylonjs-materials/fire/fire.vertex";
    export class FireMaterial extends PushMaterial {
        private _diffuseTexture;
        diffuseTexture: Nullable<BaseTexture>;
        private _distortionTexture;
        distortionTexture: Nullable<BaseTexture>;
        private _opacityTexture;
        opacityTexture: Nullable<BaseTexture>;
        diffuseColor: Color3;
        speed: number;
        private _scaledDiffuse;
        private _renderId;
        private _lastTime;
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
declare module "babylonjs-materials/fire/index" {
    export * from "babylonjs-materials/fire/fireMaterial";
}
declare module "babylonjs-materials/fur/fur.fragment" {
    import "babylonjs/Shaders/ShadersInclude/helperFunctions";
    import "babylonjs/Shaders/ShadersInclude/lightFragmentDeclaration";
    import "babylonjs/Shaders/ShadersInclude/lightUboDeclaration";
    import "babylonjs/Shaders/ShadersInclude/lightsFragmentFunctions";
    import "babylonjs/Shaders/ShadersInclude/shadowsFragmentFunctions";
    import "babylonjs/Shaders/ShadersInclude/fogFragmentDeclaration";
    import "babylonjs/Shaders/ShadersInclude/clipPlaneFragmentDeclaration";
    import "babylonjs/Shaders/ShadersInclude/clipPlaneFragment";
    import "babylonjs/Shaders/ShadersInclude/depthPrePass";
    import "babylonjs/Shaders/ShadersInclude/lightFragment";
    import "babylonjs/Shaders/ShadersInclude/fogFragment";
    /** @hidden */
    export var furPixelShader: {
        name: string;
        shader: string;
    };
}
declare module "babylonjs-materials/fur/fur.vertex" {
    import "babylonjs/Shaders/ShadersInclude/bonesDeclaration";
    import "babylonjs/Shaders/ShadersInclude/instancesDeclaration";
    import "babylonjs/Shaders/ShadersInclude/clipPlaneVertexDeclaration";
    import "babylonjs/Shaders/ShadersInclude/fogVertexDeclaration";
    import "babylonjs/Shaders/ShadersInclude/lightFragmentDeclaration";
    import "babylonjs/Shaders/ShadersInclude/lightUboDeclaration";
    import "babylonjs/Shaders/ShadersInclude/instancesVertex";
    import "babylonjs/Shaders/ShadersInclude/bonesVertex";
    import "babylonjs/Shaders/ShadersInclude/clipPlaneVertex";
    import "babylonjs/Shaders/ShadersInclude/fogVertex";
    import "babylonjs/Shaders/ShadersInclude/shadowsVertex";
    /** @hidden */
    export var furVertexShader: {
        name: string;
        shader: string;
    };
}
declare module "babylonjs-materials/fur/furMaterial" {
    import { Nullable } from "babylonjs/types";
    import { Vector3, Color3, Matrix } from "babylonjs/Maths/math";
    import { IAnimatable } from "babylonjs/Misc/tools";
    import { BaseTexture } from "babylonjs/Materials/Textures/baseTexture";
    import { DynamicTexture } from "babylonjs/Materials/Textures/dynamicTexture";
    import { PushMaterial } from "babylonjs/Materials/pushMaterial";
    import { AbstractMesh } from "babylonjs/Meshes/abstractMesh";
    import { SubMesh } from "babylonjs/Meshes/subMesh";
    import { Mesh } from "babylonjs/Meshes/mesh";
    import { Scene } from "babylonjs/scene";
    import "babylonjs-materials/fur/fur.fragment";
    import "babylonjs-materials/fur/fur.vertex";
    export class FurMaterial extends PushMaterial {
        private _diffuseTexture;
        diffuseTexture: BaseTexture;
        private _heightTexture;
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
        private _disableLighting;
        disableLighting: boolean;
        private _maxSimultaneousLights;
        maxSimultaneousLights: number;
        highLevelFur: boolean;
        _meshes: AbstractMesh[];
        private _renderId;
        private _furTime;
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
declare module "babylonjs-materials/fur/index" {
    export * from "babylonjs-materials/fur/furMaterial";
}
declare module "babylonjs-materials/gradient/gradient.fragment" {
    import "babylonjs/Shaders/ShadersInclude/helperFunctions";
    import "babylonjs/Shaders/ShadersInclude/lightFragmentDeclaration";
    import "babylonjs/Shaders/ShadersInclude/lightUboDeclaration";
    import "babylonjs/Shaders/ShadersInclude/lightsFragmentFunctions";
    import "babylonjs/Shaders/ShadersInclude/shadowsFragmentFunctions";
    import "babylonjs/Shaders/ShadersInclude/clipPlaneFragmentDeclaration";
    import "babylonjs/Shaders/ShadersInclude/fogFragmentDeclaration";
    import "babylonjs/Shaders/ShadersInclude/clipPlaneFragment";
    import "babylonjs/Shaders/ShadersInclude/depthPrePass";
    import "babylonjs/Shaders/ShadersInclude/lightFragment";
    import "babylonjs/Shaders/ShadersInclude/fogFragment";
    /** @hidden */
    export var gradientPixelShader: {
        name: string;
        shader: string;
    };
}
declare module "babylonjs-materials/gradient/gradient.vertex" {
    import "babylonjs/Shaders/ShadersInclude/bonesDeclaration";
    import "babylonjs/Shaders/ShadersInclude/instancesDeclaration";
    import "babylonjs/Shaders/ShadersInclude/clipPlaneVertexDeclaration";
    import "babylonjs/Shaders/ShadersInclude/fogVertexDeclaration";
    import "babylonjs/Shaders/ShadersInclude/lightFragmentDeclaration";
    import "babylonjs/Shaders/ShadersInclude/lightUboDeclaration";
    import "babylonjs/Shaders/ShadersInclude/instancesVertex";
    import "babylonjs/Shaders/ShadersInclude/bonesVertex";
    import "babylonjs/Shaders/ShadersInclude/clipPlaneVertex";
    import "babylonjs/Shaders/ShadersInclude/fogVertex";
    import "babylonjs/Shaders/ShadersInclude/shadowsVertex";
    /** @hidden */
    export var gradientVertexShader: {
        name: string;
        shader: string;
    };
}
declare module "babylonjs-materials/gradient/gradientMaterial" {
    import { Nullable } from "babylonjs/types";
    import { Color3, Matrix } from "babylonjs/Maths/math";
    import { IAnimatable } from "babylonjs/Misc/tools";
    import { BaseTexture } from "babylonjs/Materials/Textures/baseTexture";
    import { PushMaterial } from "babylonjs/Materials/pushMaterial";
    import { AbstractMesh } from "babylonjs/Meshes/abstractMesh";
    import { SubMesh } from "babylonjs/Meshes/subMesh";
    import { Mesh } from "babylonjs/Meshes/mesh";
    import { Scene } from "babylonjs/scene";
    import "babylonjs-materials/gradient/gradient.fragment";
    import "babylonjs-materials/gradient/gradient.vertex";
    export class GradientMaterial extends PushMaterial {
        private _maxSimultaneousLights;
        maxSimultaneousLights: number;
        topColor: Color3;
        topColorAlpha: number;
        bottomColor: Color3;
        bottomColorAlpha: number;
        offset: number;
        scale: number;
        smoothness: number;
        private _disableLighting;
        disableLighting: boolean;
        private _renderId;
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
declare module "babylonjs-materials/gradient/index" {
    export * from "babylonjs-materials/gradient/gradientMaterial";
}
declare module "babylonjs-materials/grid/grid.fragment" {
    import "babylonjs/Shaders/ShadersInclude/fogFragmentDeclaration";
    import "babylonjs/Shaders/ShadersInclude/fogFragment";
    /** @hidden */
    export var gridPixelShader: {
        name: string;
        shader: string;
    };
}
declare module "babylonjs-materials/grid/grid.vertex" {
    import "babylonjs/Shaders/ShadersInclude/fogVertexDeclaration";
    import "babylonjs/Shaders/ShadersInclude/fogVertex";
    /** @hidden */
    export var gridVertexShader: {
        name: string;
        shader: string;
    };
}
declare module "babylonjs-materials/grid/gridMaterial" {
    import { Color3, Vector3, Matrix } from "babylonjs/Maths/math";
    import { BaseTexture } from "babylonjs/Materials/Textures/baseTexture";
    import { PushMaterial } from "babylonjs/Materials/pushMaterial";
    import { AbstractMesh } from "babylonjs/Meshes/abstractMesh";
    import { SubMesh } from "babylonjs/Meshes/subMesh";
    import { Mesh } from "babylonjs/Meshes/mesh";
    import { Scene } from "babylonjs/scene";
    import "babylonjs-materials/grid/grid.fragment";
    import "babylonjs-materials/grid/grid.vertex";
    /**
     * The grid materials allows you to wrap any shape with a grid.
     * Colors are customizable.
     */
    export class GridMaterial extends PushMaterial {
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
        private _opacityTexture;
        opacityTexture: BaseTexture;
        private _gridControl;
        private _renderId;
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
        /**
         * Dispose the material and its associated resources.
         * @param forceDisposeEffect will also dispose the used effect when true
         */
        dispose(forceDisposeEffect?: boolean): void;
        clone(name: string): GridMaterial;
        serialize(): any;
        getClassName(): string;
        static Parse(source: any, scene: Scene, rootUrl: string): GridMaterial;
    }
}
declare module "babylonjs-materials/grid/index" {
    export * from "babylonjs-materials/grid/gridMaterial";
}
declare module "babylonjs-materials/lava/lava.fragment" {
    import "babylonjs/Shaders/ShadersInclude/helperFunctions";
    import "babylonjs/Shaders/ShadersInclude/lightFragmentDeclaration";
    import "babylonjs/Shaders/ShadersInclude/lightUboDeclaration";
    import "babylonjs/Shaders/ShadersInclude/lightsFragmentFunctions";
    import "babylonjs/Shaders/ShadersInclude/shadowsFragmentFunctions";
    import "babylonjs/Shaders/ShadersInclude/clipPlaneFragmentDeclaration";
    import "babylonjs/Shaders/ShadersInclude/fogFragmentDeclaration";
    import "babylonjs/Shaders/ShadersInclude/clipPlaneFragment";
    import "babylonjs/Shaders/ShadersInclude/depthPrePass";
    import "babylonjs/Shaders/ShadersInclude/lightFragment";
    import "babylonjs/Shaders/ShadersInclude/fogFragment";
    /** @hidden */
    export var lavaPixelShader: {
        name: string;
        shader: string;
    };
}
declare module "babylonjs-materials/lava/lava.vertex" {
    import "babylonjs/Shaders/ShadersInclude/bonesDeclaration";
    import "babylonjs/Shaders/ShadersInclude/instancesDeclaration";
    import "babylonjs/Shaders/ShadersInclude/clipPlaneVertexDeclaration";
    import "babylonjs/Shaders/ShadersInclude/fogVertexDeclaration";
    import "babylonjs/Shaders/ShadersInclude/lightFragmentDeclaration";
    import "babylonjs/Shaders/ShadersInclude/lightUboDeclaration";
    import "babylonjs/Shaders/ShadersInclude/instancesVertex";
    import "babylonjs/Shaders/ShadersInclude/bonesVertex";
    import "babylonjs/Shaders/ShadersInclude/clipPlaneVertex";
    import "babylonjs/Shaders/ShadersInclude/fogVertex";
    import "babylonjs/Shaders/ShadersInclude/shadowsVertex";
    /** @hidden */
    export var lavaVertexShader: {
        name: string;
        shader: string;
    };
}
declare module "babylonjs-materials/lava/lavaMaterial" {
    import { Nullable } from "babylonjs/types";
    import { Color3, Matrix } from "babylonjs/Maths/math";
    import { IAnimatable } from "babylonjs/Misc/tools";
    import { BaseTexture } from "babylonjs/Materials/Textures/baseTexture";
    import { PushMaterial } from "babylonjs/Materials/pushMaterial";
    import { AbstractMesh } from "babylonjs/Meshes/abstractMesh";
    import { SubMesh } from "babylonjs/Meshes/subMesh";
    import { Mesh } from "babylonjs/Meshes/mesh";
    import { Scene } from "babylonjs/scene";
    import "babylonjs-materials/lava/lava.fragment";
    import "babylonjs-materials/lava/lava.vertex";
    export class LavaMaterial extends PushMaterial {
        private _diffuseTexture;
        diffuseTexture: BaseTexture;
        noiseTexture: BaseTexture;
        fogColor: Color3;
        speed: number;
        movingSpeed: number;
        lowFrequencySpeed: number;
        fogDensity: number;
        private _lastTime;
        diffuseColor: Color3;
        private _disableLighting;
        disableLighting: boolean;
        private _unlit;
        unlit: boolean;
        private _maxSimultaneousLights;
        maxSimultaneousLights: number;
        private _scaledDiffuse;
        private _renderId;
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
declare module "babylonjs-materials/lava/index" {
    export * from "babylonjs-materials/lava/lavaMaterial";
}
declare module "babylonjs-materials/mix/mix.fragment" {
    import "babylonjs/Shaders/ShadersInclude/helperFunctions";
    import "babylonjs/Shaders/ShadersInclude/lightFragmentDeclaration";
    import "babylonjs/Shaders/ShadersInclude/lightUboDeclaration";
    import "babylonjs/Shaders/ShadersInclude/lightsFragmentFunctions";
    import "babylonjs/Shaders/ShadersInclude/shadowsFragmentFunctions";
    import "babylonjs/Shaders/ShadersInclude/clipPlaneFragmentDeclaration";
    import "babylonjs/Shaders/ShadersInclude/fogFragmentDeclaration";
    import "babylonjs/Shaders/ShadersInclude/clipPlaneFragment";
    import "babylonjs/Shaders/ShadersInclude/depthPrePass";
    import "babylonjs/Shaders/ShadersInclude/lightFragment";
    import "babylonjs/Shaders/ShadersInclude/fogFragment";
    /** @hidden */
    export var mixPixelShader: {
        name: string;
        shader: string;
    };
}
declare module "babylonjs-materials/mix/mix.vertex" {
    import "babylonjs/Shaders/ShadersInclude/bonesDeclaration";
    import "babylonjs/Shaders/ShadersInclude/instancesDeclaration";
    import "babylonjs/Shaders/ShadersInclude/clipPlaneVertexDeclaration";
    import "babylonjs/Shaders/ShadersInclude/fogVertexDeclaration";
    import "babylonjs/Shaders/ShadersInclude/lightFragmentDeclaration";
    import "babylonjs/Shaders/ShadersInclude/lightUboDeclaration";
    import "babylonjs/Shaders/ShadersInclude/instancesVertex";
    import "babylonjs/Shaders/ShadersInclude/bonesVertex";
    import "babylonjs/Shaders/ShadersInclude/clipPlaneVertex";
    import "babylonjs/Shaders/ShadersInclude/fogVertex";
    import "babylonjs/Shaders/ShadersInclude/shadowsVertex";
    /** @hidden */
    export var mixVertexShader: {
        name: string;
        shader: string;
    };
}
declare module "babylonjs-materials/mix/mixMaterial" {
    import { Nullable } from "babylonjs/types";
    import { Color3, Matrix } from "babylonjs/Maths/math";
    import { IAnimatable } from "babylonjs/Misc/tools";
    import { BaseTexture } from "babylonjs/Materials/Textures/baseTexture";
    import { Texture } from "babylonjs/Materials/Textures/texture";
    import { PushMaterial } from "babylonjs/Materials/pushMaterial";
    import { AbstractMesh } from "babylonjs/Meshes/abstractMesh";
    import { SubMesh } from "babylonjs/Meshes/subMesh";
    import { Mesh } from "babylonjs/Meshes/mesh";
    import { Scene } from "babylonjs/scene";
    import "babylonjs-materials/mix/mix.fragment";
    import "babylonjs-materials/mix/mix.vertex";
    export class MixMaterial extends PushMaterial {
        /**
         * Mix textures
         */
        private _mixTexture1;
        mixTexture1: BaseTexture;
        private _mixTexture2;
        mixTexture2: BaseTexture;
        /**
         * Diffuse textures
         */
        private _diffuseTexture1;
        diffuseTexture1: Texture;
        private _diffuseTexture2;
        diffuseTexture2: Texture;
        private _diffuseTexture3;
        diffuseTexture3: Texture;
        private _diffuseTexture4;
        diffuseTexture4: Texture;
        private _diffuseTexture5;
        diffuseTexture5: Texture;
        private _diffuseTexture6;
        diffuseTexture6: Texture;
        private _diffuseTexture7;
        diffuseTexture7: Texture;
        private _diffuseTexture8;
        diffuseTexture8: Texture;
        /**
         * Uniforms
         */
        diffuseColor: Color3;
        specularColor: Color3;
        specularPower: number;
        private _disableLighting;
        disableLighting: boolean;
        private _maxSimultaneousLights;
        maxSimultaneousLights: number;
        private _renderId;
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
declare module "babylonjs-materials/mix/index" {
    export * from "babylonjs-materials/mix/mixMaterial";
}
declare module "babylonjs-materials/normal/normal.fragment" {
    import "babylonjs/Shaders/ShadersInclude/helperFunctions";
    import "babylonjs/Shaders/ShadersInclude/lightFragmentDeclaration";
    import "babylonjs/Shaders/ShadersInclude/lightUboDeclaration";
    import "babylonjs/Shaders/ShadersInclude/lightsFragmentFunctions";
    import "babylonjs/Shaders/ShadersInclude/shadowsFragmentFunctions";
    import "babylonjs/Shaders/ShadersInclude/clipPlaneFragmentDeclaration";
    import "babylonjs/Shaders/ShadersInclude/fogFragmentDeclaration";
    import "babylonjs/Shaders/ShadersInclude/clipPlaneFragment";
    import "babylonjs/Shaders/ShadersInclude/depthPrePass";
    import "babylonjs/Shaders/ShadersInclude/lightFragment";
    import "babylonjs/Shaders/ShadersInclude/fogFragment";
    /** @hidden */
    export var normalPixelShader: {
        name: string;
        shader: string;
    };
}
declare module "babylonjs-materials/normal/normal.vertex" {
    import "babylonjs/Shaders/ShadersInclude/bonesDeclaration";
    import "babylonjs/Shaders/ShadersInclude/instancesDeclaration";
    import "babylonjs/Shaders/ShadersInclude/clipPlaneVertexDeclaration";
    import "babylonjs/Shaders/ShadersInclude/fogVertexDeclaration";
    import "babylonjs/Shaders/ShadersInclude/lightFragmentDeclaration";
    import "babylonjs/Shaders/ShadersInclude/lightUboDeclaration";
    import "babylonjs/Shaders/ShadersInclude/instancesVertex";
    import "babylonjs/Shaders/ShadersInclude/bonesVertex";
    import "babylonjs/Shaders/ShadersInclude/clipPlaneVertex";
    import "babylonjs/Shaders/ShadersInclude/fogVertex";
    import "babylonjs/Shaders/ShadersInclude/shadowsVertex";
    /** @hidden */
    export var normalVertexShader: {
        name: string;
        shader: string;
    };
}
declare module "babylonjs-materials/normal/normalMaterial" {
    import { Nullable } from "babylonjs/types";
    import { Color3, Matrix } from "babylonjs/Maths/math";
    import { IAnimatable } from "babylonjs/Misc/tools";
    import { BaseTexture } from "babylonjs/Materials/Textures/baseTexture";
    import { PushMaterial } from "babylonjs/Materials/pushMaterial";
    import { AbstractMesh } from "babylonjs/Meshes/abstractMesh";
    import { SubMesh } from "babylonjs/Meshes/subMesh";
    import { Mesh } from "babylonjs/Meshes/mesh";
    import { Scene } from "babylonjs/scene";
    import "babylonjs-materials/normal/normal.fragment";
    import "babylonjs-materials/normal/normal.vertex";
    export class NormalMaterial extends PushMaterial {
        private _diffuseTexture;
        diffuseTexture: BaseTexture;
        diffuseColor: Color3;
        private _disableLighting;
        disableLighting: boolean;
        private _maxSimultaneousLights;
        maxSimultaneousLights: number;
        private _renderId;
        constructor(name: string, scene: Scene);
        needAlphaBlending(): boolean;
        needAlphaBlendingForMesh(mesh: AbstractMesh): boolean;
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
declare module "babylonjs-materials/normal/index" {
    export * from "babylonjs-materials/normal/normalMaterial";
}
declare module "babylonjs-materials/shadowOnly/shadowOnly.fragment" {
    import "babylonjs/Shaders/ShadersInclude/helperFunctions";
    import "babylonjs/Shaders/ShadersInclude/lightFragmentDeclaration";
    import "babylonjs/Shaders/ShadersInclude/lightUboDeclaration";
    import "babylonjs/Shaders/ShadersInclude/lightsFragmentFunctions";
    import "babylonjs/Shaders/ShadersInclude/shadowsFragmentFunctions";
    import "babylonjs/Shaders/ShadersInclude/clipPlaneFragmentDeclaration";
    import "babylonjs/Shaders/ShadersInclude/fogFragmentDeclaration";
    import "babylonjs/Shaders/ShadersInclude/clipPlaneFragment";
    import "babylonjs/Shaders/ShadersInclude/lightFragment";
    import "babylonjs/Shaders/ShadersInclude/fogFragment";
    /** @hidden */
    export var shadowOnlyPixelShader: {
        name: string;
        shader: string;
    };
}
declare module "babylonjs-materials/shadowOnly/shadowOnly.vertex" {
    import "babylonjs/Shaders/ShadersInclude/bonesDeclaration";
    import "babylonjs/Shaders/ShadersInclude/instancesDeclaration";
    import "babylonjs/Shaders/ShadersInclude/clipPlaneVertexDeclaration";
    import "babylonjs/Shaders/ShadersInclude/fogVertexDeclaration";
    import "babylonjs/Shaders/ShadersInclude/lightFragmentDeclaration";
    import "babylonjs/Shaders/ShadersInclude/lightUboDeclaration";
    import "babylonjs/Shaders/ShadersInclude/instancesVertex";
    import "babylonjs/Shaders/ShadersInclude/bonesVertex";
    import "babylonjs/Shaders/ShadersInclude/clipPlaneVertex";
    import "babylonjs/Shaders/ShadersInclude/fogVertex";
    import "babylonjs/Shaders/ShadersInclude/shadowsVertex";
    /** @hidden */
    export var shadowOnlyVertexShader: {
        name: string;
        shader: string;
    };
}
declare module "babylonjs-materials/shadowOnly/shadowOnlyMaterial" {
    import { Nullable } from "babylonjs/types";
    import { Color3, Matrix } from "babylonjs/Maths/math";
    import { BaseTexture } from "babylonjs/Materials/Textures/baseTexture";
    import { IShadowLight } from "babylonjs/Lights/shadowLight";
    import { PushMaterial } from "babylonjs/Materials/pushMaterial";
    import { AbstractMesh } from "babylonjs/Meshes/abstractMesh";
    import { SubMesh } from "babylonjs/Meshes/subMesh";
    import { Mesh } from "babylonjs/Meshes/mesh";
    import { Scene } from "babylonjs/scene";
    import "babylonjs-materials/shadowOnly/shadowOnly.fragment";
    import "babylonjs-materials/shadowOnly/shadowOnly.vertex";
    export class ShadowOnlyMaterial extends PushMaterial {
        private _renderId;
        private _activeLight;
        constructor(name: string, scene: Scene);
        shadowColor: Color3;
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
declare module "babylonjs-materials/shadowOnly/index" {
    export * from "babylonjs-materials/shadowOnly/shadowOnlyMaterial";
}
declare module "babylonjs-materials/simple/simple.fragment" {
    import "babylonjs/Shaders/ShadersInclude/helperFunctions";
    import "babylonjs/Shaders/ShadersInclude/lightFragmentDeclaration";
    import "babylonjs/Shaders/ShadersInclude/lightUboDeclaration";
    import "babylonjs/Shaders/ShadersInclude/lightsFragmentFunctions";
    import "babylonjs/Shaders/ShadersInclude/shadowsFragmentFunctions";
    import "babylonjs/Shaders/ShadersInclude/clipPlaneFragmentDeclaration";
    import "babylonjs/Shaders/ShadersInclude/fogFragmentDeclaration";
    import "babylonjs/Shaders/ShadersInclude/clipPlaneFragment";
    import "babylonjs/Shaders/ShadersInclude/depthPrePass";
    import "babylonjs/Shaders/ShadersInclude/lightFragment";
    import "babylonjs/Shaders/ShadersInclude/fogFragment";
    /** @hidden */
    export var simplePixelShader: {
        name: string;
        shader: string;
    };
}
declare module "babylonjs-materials/simple/simple.vertex" {
    import "babylonjs/Shaders/ShadersInclude/bonesDeclaration";
    import "babylonjs/Shaders/ShadersInclude/instancesDeclaration";
    import "babylonjs/Shaders/ShadersInclude/clipPlaneVertexDeclaration";
    import "babylonjs/Shaders/ShadersInclude/fogVertexDeclaration";
    import "babylonjs/Shaders/ShadersInclude/lightFragmentDeclaration";
    import "babylonjs/Shaders/ShadersInclude/lightUboDeclaration";
    import "babylonjs/Shaders/ShadersInclude/instancesVertex";
    import "babylonjs/Shaders/ShadersInclude/bonesVertex";
    import "babylonjs/Shaders/ShadersInclude/clipPlaneVertex";
    import "babylonjs/Shaders/ShadersInclude/fogVertex";
    import "babylonjs/Shaders/ShadersInclude/shadowsVertex";
    /** @hidden */
    export var simpleVertexShader: {
        name: string;
        shader: string;
    };
}
declare module "babylonjs-materials/simple/simpleMaterial" {
    import { Nullable } from "babylonjs/types";
    import { Color3, Matrix } from "babylonjs/Maths/math";
    import { IAnimatable } from "babylonjs/Misc/tools";
    import { BaseTexture } from "babylonjs/Materials/Textures/baseTexture";
    import { PushMaterial } from "babylonjs/Materials/pushMaterial";
    import { AbstractMesh } from "babylonjs/Meshes/abstractMesh";
    import { SubMesh } from "babylonjs/Meshes/subMesh";
    import { Mesh } from "babylonjs/Meshes/mesh";
    import { Scene } from "babylonjs/scene";
    import "babylonjs-materials/simple/simple.fragment";
    import "babylonjs-materials/simple/simple.vertex";
    export class SimpleMaterial extends PushMaterial {
        private _diffuseTexture;
        diffuseTexture: BaseTexture;
        diffuseColor: Color3;
        private _disableLighting;
        disableLighting: boolean;
        private _maxSimultaneousLights;
        maxSimultaneousLights: number;
        private _renderId;
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
declare module "babylonjs-materials/simple/index" {
    export * from "babylonjs-materials/simple/simpleMaterial";
}
declare module "babylonjs-materials/sky/sky.fragment" {
    import "babylonjs/Shaders/ShadersInclude/clipPlaneFragmentDeclaration";
    import "babylonjs/Shaders/ShadersInclude/fogFragmentDeclaration";
    import "babylonjs/Shaders/ShadersInclude/clipPlaneFragment";
    import "babylonjs/Shaders/ShadersInclude/fogFragment";
    /** @hidden */
    export var skyPixelShader: {
        name: string;
        shader: string;
    };
}
declare module "babylonjs-materials/sky/sky.vertex" {
    import "babylonjs/Shaders/ShadersInclude/clipPlaneVertexDeclaration";
    import "babylonjs/Shaders/ShadersInclude/fogVertexDeclaration";
    import "babylonjs/Shaders/ShadersInclude/clipPlaneVertex";
    import "babylonjs/Shaders/ShadersInclude/fogVertex";
    /** @hidden */
    export var skyVertexShader: {
        name: string;
        shader: string;
    };
}
declare module "babylonjs-materials/sky/skyMaterial" {
    import { Nullable } from "babylonjs/types";
    import { Vector3, Matrix } from "babylonjs/Maths/math";
    import { IAnimatable } from "babylonjs/Misc/tools";
    import { BaseTexture } from "babylonjs/Materials/Textures/baseTexture";
    import { PushMaterial } from "babylonjs/Materials/pushMaterial";
    import { AbstractMesh } from "babylonjs/Meshes/abstractMesh";
    import { SubMesh } from "babylonjs/Meshes/subMesh";
    import { Mesh } from "babylonjs/Meshes/mesh";
    import { Scene } from "babylonjs/scene";
    import "babylonjs-materials/sky/sky.fragment";
    import "babylonjs-materials/sky/sky.vertex";
    /**
     * This is the sky material which allows to create dynamic and texture free effects for skyboxes.
     * @see https://doc.babylonjs.com/extensions/sky
     */
    export class SkyMaterial extends PushMaterial {
        /**
         * Defines the overall luminance of sky in interval ]0, 1[.
         */
        luminance: number;
        /**
        * Defines the amount (scattering) of haze as opposed to molecules in atmosphere.
        */
        turbidity: number;
        /**
         * Defines the sky appearance (light intensity).
         */
        rayleigh: number;
        /**
         * Defines the mieCoefficient in interval [0, 0.1] which affects the property .mieDirectionalG.
         */
        mieCoefficient: number;
        /**
         * Defines the amount of haze particles following the Mie scattering theory.
         */
        mieDirectionalG: number;
        /**
         * Defines the distance of the sun according to the active scene camera.
         */
        distance: number;
        /**
         * Defines the sun inclination, in interval [-0.5, 0.5]. When the inclination is not 0, the sun is said
         * "inclined".
         */
        inclination: number;
        /**
         * Defines the solar azimuth in interval [0, 1]. The azimuth is the angle in the horizontal plan between
         * an object direction and a reference direction.
         */
        azimuth: number;
        /**
         * Defines the sun position in the sky on (x,y,z). If the property .useSunPosition is set to false, then
         * the property is overriden by the inclination and the azimuth and can be read at any moment.
         */
        sunPosition: Vector3;
        /**
         * Defines if the sun position should be computed (inclination and azimuth) according to the given
         * .sunPosition property.
         */
        useSunPosition: boolean;
        /**
         * Defines an offset vector used to get a horizon offset.
         * @example skyMaterial.cameraOffset.y = camera.globalPosition.y // Set horizon relative to 0 on the Y axis
         */
        cameraOffset: Vector3;
        private _cameraPosition;
        private _renderId;
        /**
         * Instantiates a new sky material.
         * This material allows to create dynamic and texture free
         * effects for skyboxes by taking care of the atmosphere state.
         * @see https://doc.babylonjs.com/extensions/sky
         * @param name Define the name of the material in the scene
         * @param scene Define the scene the material belong to
         */
        constructor(name: string, scene: Scene);
        /**
         * Specifies if the material will require alpha blending
         * @returns a boolean specifying if alpha blending is needed
         */
        needAlphaBlending(): boolean;
        /**
         * Specifies if this material should be rendered in alpha test mode
         * @returns false as the sky material doesn't need alpha testing.
         */
        needAlphaTesting(): boolean;
        /**
         * Get the texture used for alpha test purpose.
         * @returns null as the sky material has no texture.
         */
        getAlphaTestTexture(): Nullable<BaseTexture>;
        /**
         * Get if the submesh is ready to be used and all its information available.
         * Child classes can use it to update shaders
         * @param mesh defines the mesh to check
         * @param subMesh defines which submesh to check
         * @param useInstances specifies that instances should be used
         * @returns a boolean indicating that the submesh is ready or not
         */
        isReadyForSubMesh(mesh: AbstractMesh, subMesh: SubMesh, useInstances?: boolean): boolean;
        /**
         * Binds the submesh to this material by preparing the effect and shader to draw
         * @param world defines the world transformation matrix
         * @param mesh defines the mesh containing the submesh
         * @param subMesh defines the submesh to bind the material to
         */
        bindForSubMesh(world: Matrix, mesh: Mesh, subMesh: SubMesh): void;
        /**
         * Get the list of animatables in the material.
         * @returns the list of animatables object used in the material
         */
        getAnimatables(): IAnimatable[];
        /**
         * Disposes the material
         * @param forceDisposeEffect specifies if effects should be forcefully disposed
         */
        dispose(forceDisposeEffect?: boolean): void;
        /**
         * Makes a duplicate of the material, and gives it a new name
         * @param name defines the new name for the duplicated material
         * @returns the cloned material
         */
        clone(name: string): SkyMaterial;
        /**
         * Serializes this material in a JSON representation
         * @returns the serialized material object
         */
        serialize(): any;
        /**
         * Gets the current class name of the material e.g. "SkyMaterial"
         * Mainly use in serialization.
         * @returns the class name
         */
        getClassName(): string;
        /**
         * Creates a sky material from parsed material data
         * @param source defines the JSON representation of the material
         * @param scene defines the hosting scene
         * @param rootUrl defines the root URL to use to load textures and relative dependencies
         * @returns a new sky material
         */
        static Parse(source: any, scene: Scene, rootUrl: string): SkyMaterial;
    }
}
declare module "babylonjs-materials/sky/index" {
    export * from "babylonjs-materials/sky/skyMaterial";
}
declare module "babylonjs-materials/terrain/terrain.fragment" {
    import "babylonjs/Shaders/ShadersInclude/helperFunctions";
    import "babylonjs/Shaders/ShadersInclude/lightFragmentDeclaration";
    import "babylonjs/Shaders/ShadersInclude/lightUboDeclaration";
    import "babylonjs/Shaders/ShadersInclude/lightsFragmentFunctions";
    import "babylonjs/Shaders/ShadersInclude/shadowsFragmentFunctions";
    import "babylonjs/Shaders/ShadersInclude/clipPlaneFragmentDeclaration";
    import "babylonjs/Shaders/ShadersInclude/fogFragmentDeclaration";
    import "babylonjs/Shaders/ShadersInclude/clipPlaneFragment";
    import "babylonjs/Shaders/ShadersInclude/depthPrePass";
    import "babylonjs/Shaders/ShadersInclude/lightFragment";
    import "babylonjs/Shaders/ShadersInclude/fogFragment";
    /** @hidden */
    export var terrainPixelShader: {
        name: string;
        shader: string;
    };
}
declare module "babylonjs-materials/terrain/terrain.vertex" {
    import "babylonjs/Shaders/ShadersInclude/bonesDeclaration";
    import "babylonjs/Shaders/ShadersInclude/instancesDeclaration";
    import "babylonjs/Shaders/ShadersInclude/clipPlaneVertexDeclaration";
    import "babylonjs/Shaders/ShadersInclude/fogVertexDeclaration";
    import "babylonjs/Shaders/ShadersInclude/lightFragmentDeclaration";
    import "babylonjs/Shaders/ShadersInclude/lightUboDeclaration";
    import "babylonjs/Shaders/ShadersInclude/instancesVertex";
    import "babylonjs/Shaders/ShadersInclude/bonesVertex";
    import "babylonjs/Shaders/ShadersInclude/clipPlaneVertex";
    import "babylonjs/Shaders/ShadersInclude/fogVertex";
    import "babylonjs/Shaders/ShadersInclude/shadowsVertex";
    /** @hidden */
    export var terrainVertexShader: {
        name: string;
        shader: string;
    };
}
declare module "babylonjs-materials/terrain/terrainMaterial" {
    import { Nullable } from "babylonjs/types";
    import { Color3, Matrix } from "babylonjs/Maths/math";
    import { IAnimatable } from "babylonjs/Misc/tools";
    import { BaseTexture } from "babylonjs/Materials/Textures/baseTexture";
    import { Texture } from "babylonjs/Materials/Textures/texture";
    import { PushMaterial } from "babylonjs/Materials/pushMaterial";
    import { AbstractMesh } from "babylonjs/Meshes/abstractMesh";
    import { SubMesh } from "babylonjs/Meshes/subMesh";
    import { Mesh } from "babylonjs/Meshes/mesh";
    import { Scene } from "babylonjs/scene";
    import "babylonjs-materials/terrain/terrain.fragment";
    import "babylonjs-materials/terrain/terrain.vertex";
    export class TerrainMaterial extends PushMaterial {
        private _mixTexture;
        mixTexture: BaseTexture;
        private _diffuseTexture1;
        diffuseTexture1: Texture;
        private _diffuseTexture2;
        diffuseTexture2: Texture;
        private _diffuseTexture3;
        diffuseTexture3: Texture;
        private _bumpTexture1;
        bumpTexture1: Texture;
        private _bumpTexture2;
        bumpTexture2: Texture;
        private _bumpTexture3;
        bumpTexture3: Texture;
        diffuseColor: Color3;
        specularColor: Color3;
        specularPower: number;
        private _disableLighting;
        disableLighting: boolean;
        private _maxSimultaneousLights;
        maxSimultaneousLights: number;
        private _renderId;
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
declare module "babylonjs-materials/terrain/index" {
    export * from "babylonjs-materials/terrain/terrainMaterial";
}
declare module "babylonjs-materials/triPlanar/triplanar.fragment" {
    import "babylonjs/Shaders/ShadersInclude/helperFunctions";
    import "babylonjs/Shaders/ShadersInclude/lightFragmentDeclaration";
    import "babylonjs/Shaders/ShadersInclude/lightUboDeclaration";
    import "babylonjs/Shaders/ShadersInclude/lightsFragmentFunctions";
    import "babylonjs/Shaders/ShadersInclude/shadowsFragmentFunctions";
    import "babylonjs/Shaders/ShadersInclude/clipPlaneFragmentDeclaration";
    import "babylonjs/Shaders/ShadersInclude/fogFragmentDeclaration";
    import "babylonjs/Shaders/ShadersInclude/clipPlaneFragment";
    import "babylonjs/Shaders/ShadersInclude/depthPrePass";
    import "babylonjs/Shaders/ShadersInclude/lightFragment";
    import "babylonjs/Shaders/ShadersInclude/fogFragment";
    /** @hidden */
    export var triplanarPixelShader: {
        name: string;
        shader: string;
    };
}
declare module "babylonjs-materials/triPlanar/triplanar.vertex" {
    import "babylonjs/Shaders/ShadersInclude/bonesDeclaration";
    import "babylonjs/Shaders/ShadersInclude/instancesDeclaration";
    import "babylonjs/Shaders/ShadersInclude/clipPlaneVertexDeclaration";
    import "babylonjs/Shaders/ShadersInclude/fogVertexDeclaration";
    import "babylonjs/Shaders/ShadersInclude/lightFragmentDeclaration";
    import "babylonjs/Shaders/ShadersInclude/lightUboDeclaration";
    import "babylonjs/Shaders/ShadersInclude/instancesVertex";
    import "babylonjs/Shaders/ShadersInclude/bonesVertex";
    import "babylonjs/Shaders/ShadersInclude/clipPlaneVertex";
    import "babylonjs/Shaders/ShadersInclude/fogVertex";
    import "babylonjs/Shaders/ShadersInclude/shadowsVertex";
    /** @hidden */
    export var triplanarVertexShader: {
        name: string;
        shader: string;
    };
}
declare module "babylonjs-materials/triPlanar/triPlanarMaterial" {
    import { Nullable } from "babylonjs/types";
    import { Color3, Matrix } from "babylonjs/Maths/math";
    import { IAnimatable } from "babylonjs/Misc/tools";
    import { BaseTexture } from "babylonjs/Materials/Textures/baseTexture";
    import { PushMaterial } from "babylonjs/Materials/pushMaterial";
    import { AbstractMesh } from "babylonjs/Meshes/abstractMesh";
    import { SubMesh } from "babylonjs/Meshes/subMesh";
    import { Mesh } from "babylonjs/Meshes/mesh";
    import { Scene } from "babylonjs/scene";
    import "babylonjs-materials/triPlanar/triplanar.fragment";
    import "babylonjs-materials/triPlanar/triplanar.vertex";
    export class TriPlanarMaterial extends PushMaterial {
        mixTexture: BaseTexture;
        private _diffuseTextureX;
        diffuseTextureX: BaseTexture;
        private _diffuseTextureY;
        diffuseTextureY: BaseTexture;
        private _diffuseTextureZ;
        diffuseTextureZ: BaseTexture;
        private _normalTextureX;
        normalTextureX: BaseTexture;
        private _normalTextureY;
        normalTextureY: BaseTexture;
        private _normalTextureZ;
        normalTextureZ: BaseTexture;
        tileSize: number;
        diffuseColor: Color3;
        specularColor: Color3;
        specularPower: number;
        private _disableLighting;
        disableLighting: boolean;
        private _maxSimultaneousLights;
        maxSimultaneousLights: number;
        private _renderId;
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
declare module "babylonjs-materials/triPlanar/index" {
    export * from "babylonjs-materials/triPlanar/triPlanarMaterial";
}
declare module "babylonjs-materials/water/water.fragment" {
    import "babylonjs/Shaders/ShadersInclude/helperFunctions";
    import "babylonjs/Shaders/ShadersInclude/lightFragmentDeclaration";
    import "babylonjs/Shaders/ShadersInclude/lightUboDeclaration";
    import "babylonjs/Shaders/ShadersInclude/lightsFragmentFunctions";
    import "babylonjs/Shaders/ShadersInclude/shadowsFragmentFunctions";
    import "babylonjs/Shaders/ShadersInclude/clipPlaneFragmentDeclaration";
    import "babylonjs/Shaders/ShadersInclude/logDepthDeclaration";
    import "babylonjs/Shaders/ShadersInclude/fogFragmentDeclaration";
    import "babylonjs/Shaders/ShadersInclude/clipPlaneFragment";
    import "babylonjs/Shaders/ShadersInclude/lightFragment";
    import "babylonjs/Shaders/ShadersInclude/logDepthFragment";
    import "babylonjs/Shaders/ShadersInclude/fogFragment";
    /** @hidden */
    export var waterPixelShader: {
        name: string;
        shader: string;
    };
}
declare module "babylonjs-materials/water/water.vertex" {
    import "babylonjs/Shaders/ShadersInclude/bonesDeclaration";
    import "babylonjs/Shaders/ShadersInclude/instancesDeclaration";
    import "babylonjs/Shaders/ShadersInclude/clipPlaneVertexDeclaration";
    import "babylonjs/Shaders/ShadersInclude/fogVertexDeclaration";
    import "babylonjs/Shaders/ShadersInclude/lightFragmentDeclaration";
    import "babylonjs/Shaders/ShadersInclude/lightUboDeclaration";
    import "babylonjs/Shaders/ShadersInclude/logDepthDeclaration";
    import "babylonjs/Shaders/ShadersInclude/instancesVertex";
    import "babylonjs/Shaders/ShadersInclude/bonesVertex";
    import "babylonjs/Shaders/ShadersInclude/clipPlaneVertex";
    import "babylonjs/Shaders/ShadersInclude/fogVertex";
    import "babylonjs/Shaders/ShadersInclude/shadowsVertex";
    import "babylonjs/Shaders/ShadersInclude/logDepthVertex";
    /** @hidden */
    export var waterVertexShader: {
        name: string;
        shader: string;
    };
}
declare module "babylonjs-materials/water/waterMaterial" {
    import { Nullable } from "babylonjs/types";
    import { Vector2, Color3, Matrix } from "babylonjs/Maths/math";
    import { IAnimatable } from "babylonjs/Misc/tools";
    import { SmartArray } from "babylonjs/Misc/smartArray";
    import { BaseTexture } from "babylonjs/Materials/Textures/baseTexture";
    import { RenderTargetTexture } from "babylonjs/Materials/Textures/renderTargetTexture";
    import { PushMaterial } from "babylonjs/Materials/pushMaterial";
    import { AbstractMesh } from "babylonjs/Meshes/abstractMesh";
    import { SubMesh } from "babylonjs/Meshes/subMesh";
    import { Mesh } from "babylonjs/Meshes/mesh";
    import { Scene } from "babylonjs/scene";
    import "babylonjs-materials/water/water.fragment";
    import "babylonjs-materials/water/water.vertex";
    export class WaterMaterial extends PushMaterial {
        renderTargetSize: Vector2;
        private _bumpTexture;
        bumpTexture: BaseTexture;
        diffuseColor: Color3;
        specularColor: Color3;
        specularPower: number;
        private _disableLighting;
        disableLighting: boolean;
        private _maxSimultaneousLights;
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
        /**
         * @param {boolean}: Add a smaller moving bump to less steady waves.
         */
        private _bumpSuperimpose;
        bumpSuperimpose: boolean;
        /**
         * @param {boolean}: Color refraction and reflection differently with .waterColor2 and .colorBlendFactor2. Non-linear (physically correct) fresnel.
         */
        private _fresnelSeparate;
        fresnelSeparate: boolean;
        /**
         * @param {boolean}: bump Waves modify the reflection.
         */
        private _bumpAffectsReflection;
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
        private _mesh;
        private _refractionRTT;
        private _reflectionRTT;
        private _reflectionTransform;
        private _lastTime;
        private _lastDeltaTime;
        private _renderId;
        private _useLogarithmicDepth;
        private _waitingRenderList;
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
        private _createRenderTargets;
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
declare module "babylonjs-materials/water/index" {
    export * from "babylonjs-materials/water/waterMaterial";
}
declare module "babylonjs-materials/index" {
    export * from "babylonjs-materials/cell/index";
    export * from "babylonjs-materials/custom/index";
    export * from "babylonjs-materials/fire/index";
    export * from "babylonjs-materials/fur/index";
    export * from "babylonjs-materials/gradient/index";
    export * from "babylonjs-materials/grid/index";
    export * from "babylonjs-materials/lava/index";
    export * from "babylonjs-materials/mix/index";
    export * from "babylonjs-materials/normal/index";
    export * from "babylonjs-materials/shadowOnly/index";
    export * from "babylonjs-materials/simple/index";
    export * from "babylonjs-materials/sky/index";
    export * from "babylonjs-materials/terrain/index";
    export * from "babylonjs-materials/triPlanar/index";
    export * from "babylonjs-materials/water/index";
}
declare module "babylonjs-materials/legacy/legacy-cell" {
    export * from "babylonjs-materials/cell/index";
}
declare module "babylonjs-materials/legacy/legacy-custom" {
    export * from "babylonjs-materials/custom/index";
}
declare module "babylonjs-materials/legacy/legacy-fire" {
    export * from "babylonjs-materials/fire/index";
}
declare module "babylonjs-materials/legacy/legacy-fur" {
    export * from "babylonjs-materials/fur/index";
}
declare module "babylonjs-materials/legacy/legacy-gradient" {
    export * from "babylonjs-materials/gradient/index";
}
declare module "babylonjs-materials/legacy/legacy-grid" {
    export * from "babylonjs-materials/grid/index";
}
declare module "babylonjs-materials/legacy/legacy-lava" {
    export * from "babylonjs-materials/lava/index";
}
declare module "babylonjs-materials/legacy/legacy-mix" {
    export * from "babylonjs-materials/mix/index";
}
declare module "babylonjs-materials/legacy/legacy-normal" {
    export * from "babylonjs-materials/normal/index";
}
declare module "babylonjs-materials/legacy/legacy-shadowOnly" {
    export * from "babylonjs-materials/shadowOnly/index";
}
declare module "babylonjs-materials/legacy/legacy-simple" {
    export * from "babylonjs-materials/simple/index";
}
declare module "babylonjs-materials/legacy/legacy-sky" {
    export * from "babylonjs-materials/sky/index";
}
declare module "babylonjs-materials/legacy/legacy-terrain" {
    export * from "babylonjs-materials/terrain/index";
}
declare module "babylonjs-materials/legacy/legacy-triPlanar" {
    export * from "babylonjs-materials/triPlanar/index";
}
declare module "babylonjs-materials/legacy/legacy-water" {
    export * from "babylonjs-materials/water/index";
}
declare module "babylonjs-materials/legacy/legacy" {
    export * from "babylonjs-materials/index";
}
declare module "babylonjs-materials" {
    export * from "babylonjs-materials/legacy/legacy";
}
declare module BABYLON {
    /** @hidden */
    export var cellPixelShader: {
        name: string;
        shader: string;
    };
}
declare module BABYLON {
    /** @hidden */
    export var cellVertexShader: {
        name: string;
        shader: string;
    };
}
declare module BABYLON {
    export class CellMaterial extends BABYLON.PushMaterial {
        private _diffuseTexture;
        diffuseTexture: BABYLON.BaseTexture;
        diffuseColor: BABYLON.Color3;
        _computeHighLevel: boolean;
        computeHighLevel: boolean;
        private _disableLighting;
        disableLighting: boolean;
        private _maxSimultaneousLights;
        maxSimultaneousLights: number;
        private _renderId;
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
        Fragment_Before_Lights: string;
        Fragment_Before_Fog: string;
        Fragment_Custom_Alpha: string;
        Fragment_Before_FragColor: string;
        Vertex_Begin: string;
        Vertex_Definitions: string;
        Vertex_MainBegin: string;
        Vertex_Before_PositionUpdated: string;
        Vertex_Before_NormalUpdated: string;
        Vertex_MainEnd: string;
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
        Fragment_Before_Lights(shaderPart: string): CustomMaterial;
        Fragment_Before_Fog(shaderPart: string): CustomMaterial;
        Fragment_Before_FragColor(shaderPart: string): CustomMaterial;
        Vertex_Begin(shaderPart: string): CustomMaterial;
        Vertex_Definitions(shaderPart: string): CustomMaterial;
        Vertex_MainBegin(shaderPart: string): CustomMaterial;
        Vertex_Before_PositionUpdated(shaderPart: string): CustomMaterial;
        Vertex_Before_NormalUpdated(shaderPart: string): CustomMaterial;
        Vertex_MainEnd(shaderPart: string): CustomMaterial;
    }
}
declare module BABYLON {
    export class ShaderAlebdoParts {
        constructor();
        Fragment_Begin: string;
        Fragment_Definitions: string;
        Fragment_MainBegin: string;
        Fragment_Custom_Albedo: string;
        Fragment_Before_Lights: string;
        Fragment_Custom_MetallicRoughness: string;
        Fragment_Custom_MicroSurface: string;
        Fragment_Before_Fog: string;
        Fragment_Custom_Alpha: string;
        Fragment_Before_FragColor: string;
        Vertex_Begin: string;
        Vertex_Definitions: string;
        Vertex_MainBegin: string;
        Vertex_Before_PositionUpdated: string;
        Vertex_Before_NormalUpdated: string;
        Vertex_MainEnd: string;
    }
    export class PBRCustomMaterial extends BABYLON.PBRMaterial {
        static ShaderIndexer: number;
        CustomParts: ShaderAlebdoParts;
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
        Builder(shaderName: string, uniforms: string[], uniformBuffers: string[], samplers: string[], defines: BABYLON.PBRMaterialDefines): string;
        constructor(name: string, scene: BABYLON.Scene);
        AddUniform(name: string, kind: string, param: any): PBRCustomMaterial;
        Fragment_Begin(shaderPart: string): PBRCustomMaterial;
        Fragment_Definitions(shaderPart: string): PBRCustomMaterial;
        Fragment_MainBegin(shaderPart: string): PBRCustomMaterial;
        Fragment_Custom_Albedo(shaderPart: string): PBRCustomMaterial;
        Fragment_Custom_Alpha(shaderPart: string): PBRCustomMaterial;
        Fragment_Before_Lights(shaderPart: string): PBRCustomMaterial;
        Fragment_Custom_MetallicRoughness(shaderPart: string): PBRCustomMaterial;
        Fragment_Custom_MicroSurface(shaderPart: string): PBRCustomMaterial;
        Fragment_Before_Fog(shaderPart: string): PBRCustomMaterial;
        Fragment_Before_FragColor(shaderPart: string): PBRCustomMaterial;
        Vertex_Begin(shaderPart: string): PBRCustomMaterial;
        Vertex_Definitions(shaderPart: string): PBRCustomMaterial;
        Vertex_MainBegin(shaderPart: string): PBRCustomMaterial;
        Vertex_Before_PositionUpdated(shaderPart: string): PBRCustomMaterial;
        Vertex_Before_NormalUpdated(shaderPart: string): PBRCustomMaterial;
        Vertex_MainEnd(shaderPart: string): PBRCustomMaterial;
    }
}
declare module BABYLON {
    /** @hidden */
    export var firePixelShader: {
        name: string;
        shader: string;
    };
}
declare module BABYLON {
    /** @hidden */
    export var fireVertexShader: {
        name: string;
        shader: string;
    };
}
declare module BABYLON {
    export class FireMaterial extends BABYLON.PushMaterial {
        private _diffuseTexture;
        diffuseTexture: BABYLON.Nullable<BABYLON.BaseTexture>;
        private _distortionTexture;
        distortionTexture: BABYLON.Nullable<BABYLON.BaseTexture>;
        private _opacityTexture;
        opacityTexture: BABYLON.Nullable<BABYLON.BaseTexture>;
        diffuseColor: BABYLON.Color3;
        speed: number;
        private _scaledDiffuse;
        private _renderId;
        private _lastTime;
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
    /** @hidden */
    export var furPixelShader: {
        name: string;
        shader: string;
    };
}
declare module BABYLON {
    /** @hidden */
    export var furVertexShader: {
        name: string;
        shader: string;
    };
}
declare module BABYLON {
    export class FurMaterial extends BABYLON.PushMaterial {
        private _diffuseTexture;
        diffuseTexture: BABYLON.BaseTexture;
        private _heightTexture;
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
        private _disableLighting;
        disableLighting: boolean;
        private _maxSimultaneousLights;
        maxSimultaneousLights: number;
        highLevelFur: boolean;
        _meshes: BABYLON.AbstractMesh[];
        private _renderId;
        private _furTime;
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
    /** @hidden */
    export var gradientPixelShader: {
        name: string;
        shader: string;
    };
}
declare module BABYLON {
    /** @hidden */
    export var gradientVertexShader: {
        name: string;
        shader: string;
    };
}
declare module BABYLON {
    export class GradientMaterial extends BABYLON.PushMaterial {
        private _maxSimultaneousLights;
        maxSimultaneousLights: number;
        topColor: BABYLON.Color3;
        topColorAlpha: number;
        bottomColor: BABYLON.Color3;
        bottomColorAlpha: number;
        offset: number;
        scale: number;
        smoothness: number;
        private _disableLighting;
        disableLighting: boolean;
        private _renderId;
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
    /** @hidden */
    export var gridPixelShader: {
        name: string;
        shader: string;
    };
}
declare module BABYLON {
    /** @hidden */
    export var gridVertexShader: {
        name: string;
        shader: string;
    };
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
        private _opacityTexture;
        opacityTexture: BABYLON.BaseTexture;
        private _gridControl;
        private _renderId;
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
    /** @hidden */
    export var lavaPixelShader: {
        name: string;
        shader: string;
    };
}
declare module BABYLON {
    /** @hidden */
    export var lavaVertexShader: {
        name: string;
        shader: string;
    };
}
declare module BABYLON {
    export class LavaMaterial extends BABYLON.PushMaterial {
        private _diffuseTexture;
        diffuseTexture: BABYLON.BaseTexture;
        noiseTexture: BABYLON.BaseTexture;
        fogColor: BABYLON.Color3;
        speed: number;
        movingSpeed: number;
        lowFrequencySpeed: number;
        fogDensity: number;
        private _lastTime;
        diffuseColor: BABYLON.Color3;
        private _disableLighting;
        disableLighting: boolean;
        private _unlit;
        unlit: boolean;
        private _maxSimultaneousLights;
        maxSimultaneousLights: number;
        private _scaledDiffuse;
        private _renderId;
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
    /** @hidden */
    export var mixPixelShader: {
        name: string;
        shader: string;
    };
}
declare module BABYLON {
    /** @hidden */
    export var mixVertexShader: {
        name: string;
        shader: string;
    };
}
declare module BABYLON {
    export class MixMaterial extends BABYLON.PushMaterial {
        /**
         * Mix textures
         */
        private _mixTexture1;
        mixTexture1: BABYLON.BaseTexture;
        private _mixTexture2;
        mixTexture2: BABYLON.BaseTexture;
        /**
         * Diffuse textures
         */
        private _diffuseTexture1;
        diffuseTexture1: BABYLON.Texture;
        private _diffuseTexture2;
        diffuseTexture2: BABYLON.Texture;
        private _diffuseTexture3;
        diffuseTexture3: BABYLON.Texture;
        private _diffuseTexture4;
        diffuseTexture4: BABYLON.Texture;
        private _diffuseTexture5;
        diffuseTexture5: BABYLON.Texture;
        private _diffuseTexture6;
        diffuseTexture6: BABYLON.Texture;
        private _diffuseTexture7;
        diffuseTexture7: BABYLON.Texture;
        private _diffuseTexture8;
        diffuseTexture8: BABYLON.Texture;
        /**
         * Uniforms
         */
        diffuseColor: BABYLON.Color3;
        specularColor: BABYLON.Color3;
        specularPower: number;
        private _disableLighting;
        disableLighting: boolean;
        private _maxSimultaneousLights;
        maxSimultaneousLights: number;
        private _renderId;
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
    /** @hidden */
    export var normalPixelShader: {
        name: string;
        shader: string;
    };
}
declare module BABYLON {
    /** @hidden */
    export var normalVertexShader: {
        name: string;
        shader: string;
    };
}
declare module BABYLON {
    export class NormalMaterial extends BABYLON.PushMaterial {
        private _diffuseTexture;
        diffuseTexture: BABYLON.BaseTexture;
        diffuseColor: BABYLON.Color3;
        private _disableLighting;
        disableLighting: boolean;
        private _maxSimultaneousLights;
        maxSimultaneousLights: number;
        private _renderId;
        constructor(name: string, scene: BABYLON.Scene);
        needAlphaBlending(): boolean;
        needAlphaBlendingForMesh(mesh: BABYLON.AbstractMesh): boolean;
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
    /** @hidden */
    export var shadowOnlyPixelShader: {
        name: string;
        shader: string;
    };
}
declare module BABYLON {
    /** @hidden */
    export var shadowOnlyVertexShader: {
        name: string;
        shader: string;
    };
}
declare module BABYLON {
    export class ShadowOnlyMaterial extends BABYLON.PushMaterial {
        private _renderId;
        private _activeLight;
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
    /** @hidden */
    export var simplePixelShader: {
        name: string;
        shader: string;
    };
}
declare module BABYLON {
    /** @hidden */
    export var simpleVertexShader: {
        name: string;
        shader: string;
    };
}
declare module BABYLON {
    export class SimpleMaterial extends BABYLON.PushMaterial {
        private _diffuseTexture;
        diffuseTexture: BABYLON.BaseTexture;
        diffuseColor: BABYLON.Color3;
        private _disableLighting;
        disableLighting: boolean;
        private _maxSimultaneousLights;
        maxSimultaneousLights: number;
        private _renderId;
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
    /** @hidden */
    export var skyPixelShader: {
        name: string;
        shader: string;
    };
}
declare module BABYLON {
    /** @hidden */
    export var skyVertexShader: {
        name: string;
        shader: string;
    };
}
declare module BABYLON {
    /**
     * This is the sky material which allows to create dynamic and texture free effects for skyboxes.
     * @see https://doc.babylonjs.com/extensions/sky
     */
    export class SkyMaterial extends BABYLON.PushMaterial {
        /**
         * Defines the overall luminance of sky in interval ]0, 1[.
         */
        luminance: number;
        /**
        * Defines the amount (scattering) of haze as opposed to molecules in atmosphere.
        */
        turbidity: number;
        /**
         * Defines the sky appearance (light intensity).
         */
        rayleigh: number;
        /**
         * Defines the mieCoefficient in interval [0, 0.1] which affects the property .mieDirectionalG.
         */
        mieCoefficient: number;
        /**
         * Defines the amount of haze particles following the Mie scattering theory.
         */
        mieDirectionalG: number;
        /**
         * Defines the distance of the sun according to the active scene camera.
         */
        distance: number;
        /**
         * Defines the sun inclination, in interval [-0.5, 0.5]. When the inclination is not 0, the sun is said
         * "inclined".
         */
        inclination: number;
        /**
         * Defines the solar azimuth in interval [0, 1]. The azimuth is the angle in the horizontal plan between
         * an object direction and a reference direction.
         */
        azimuth: number;
        /**
         * Defines the sun position in the sky on (x,y,z). If the property .useSunPosition is set to false, then
         * the property is overriden by the inclination and the azimuth and can be read at any moment.
         */
        sunPosition: BABYLON.Vector3;
        /**
         * Defines if the sun position should be computed (inclination and azimuth) according to the given
         * .sunPosition property.
         */
        useSunPosition: boolean;
        /**
         * Defines an offset vector used to get a horizon offset.
         * @example skyMaterial.cameraOffset.y = camera.globalPosition.y // Set horizon relative to 0 on the Y axis
         */
        cameraOffset: BABYLON.Vector3;
        private _cameraPosition;
        private _renderId;
        /**
         * Instantiates a new sky material.
         * This material allows to create dynamic and texture free
         * effects for skyboxes by taking care of the atmosphere state.
         * @see https://doc.babylonjs.com/extensions/sky
         * @param name Define the name of the material in the scene
         * @param scene Define the scene the material belong to
         */
        constructor(name: string, scene: BABYLON.Scene);
        /**
         * Specifies if the material will require alpha blending
         * @returns a boolean specifying if alpha blending is needed
         */
        needAlphaBlending(): boolean;
        /**
         * Specifies if this material should be rendered in alpha test mode
         * @returns false as the sky material doesn't need alpha testing.
         */
        needAlphaTesting(): boolean;
        /**
         * Get the texture used for alpha test purpose.
         * @returns null as the sky material has no texture.
         */
        getAlphaTestTexture(): BABYLON.Nullable<BABYLON.BaseTexture>;
        /**
         * Get if the submesh is ready to be used and all its information available.
         * Child classes can use it to update shaders
         * @param mesh defines the mesh to check
         * @param subMesh defines which submesh to check
         * @param useInstances specifies that instances should be used
         * @returns a boolean indicating that the submesh is ready or not
         */
        isReadyForSubMesh(mesh: BABYLON.AbstractMesh, subMesh: BABYLON.SubMesh, useInstances?: boolean): boolean;
        /**
         * Binds the submesh to this material by preparing the effect and shader to draw
         * @param world defines the world transformation matrix
         * @param mesh defines the mesh containing the submesh
         * @param subMesh defines the submesh to bind the material to
         */
        bindForSubMesh(world: BABYLON.Matrix, mesh: BABYLON.Mesh, subMesh: BABYLON.SubMesh): void;
        /**
         * Get the list of animatables in the material.
         * @returns the list of animatables object used in the material
         */
        getAnimatables(): BABYLON.IAnimatable[];
        /**
         * Disposes the material
         * @param forceDisposeEffect specifies if effects should be forcefully disposed
         */
        dispose(forceDisposeEffect?: boolean): void;
        /**
         * Makes a duplicate of the material, and gives it a new name
         * @param name defines the new name for the duplicated material
         * @returns the cloned material
         */
        clone(name: string): SkyMaterial;
        /**
         * Serializes this material in a JSON representation
         * @returns the serialized material object
         */
        serialize(): any;
        /**
         * Gets the current class name of the material e.g. "SkyMaterial"
         * Mainly use in serialization.
         * @returns the class name
         */
        getClassName(): string;
        /**
         * Creates a sky material from parsed material data
         * @param source defines the JSON representation of the material
         * @param scene defines the hosting scene
         * @param rootUrl defines the root URL to use to load textures and relative dependencies
         * @returns a new sky material
         */
        static Parse(source: any, scene: BABYLON.Scene, rootUrl: string): SkyMaterial;
    }
}
declare module BABYLON {
    /** @hidden */
    export var terrainPixelShader: {
        name: string;
        shader: string;
    };
}
declare module BABYLON {
    /** @hidden */
    export var terrainVertexShader: {
        name: string;
        shader: string;
    };
}
declare module BABYLON {
    export class TerrainMaterial extends BABYLON.PushMaterial {
        private _mixTexture;
        mixTexture: BABYLON.BaseTexture;
        private _diffuseTexture1;
        diffuseTexture1: BABYLON.Texture;
        private _diffuseTexture2;
        diffuseTexture2: BABYLON.Texture;
        private _diffuseTexture3;
        diffuseTexture3: BABYLON.Texture;
        private _bumpTexture1;
        bumpTexture1: BABYLON.Texture;
        private _bumpTexture2;
        bumpTexture2: BABYLON.Texture;
        private _bumpTexture3;
        bumpTexture3: BABYLON.Texture;
        diffuseColor: BABYLON.Color3;
        specularColor: BABYLON.Color3;
        specularPower: number;
        private _disableLighting;
        disableLighting: boolean;
        private _maxSimultaneousLights;
        maxSimultaneousLights: number;
        private _renderId;
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
    /** @hidden */
    export var triplanarPixelShader: {
        name: string;
        shader: string;
    };
}
declare module BABYLON {
    /** @hidden */
    export var triplanarVertexShader: {
        name: string;
        shader: string;
    };
}
declare module BABYLON {
    export class TriPlanarMaterial extends BABYLON.PushMaterial {
        mixTexture: BABYLON.BaseTexture;
        private _diffuseTextureX;
        diffuseTextureX: BABYLON.BaseTexture;
        private _diffuseTextureY;
        diffuseTextureY: BABYLON.BaseTexture;
        private _diffuseTextureZ;
        diffuseTextureZ: BABYLON.BaseTexture;
        private _normalTextureX;
        normalTextureX: BABYLON.BaseTexture;
        private _normalTextureY;
        normalTextureY: BABYLON.BaseTexture;
        private _normalTextureZ;
        normalTextureZ: BABYLON.BaseTexture;
        tileSize: number;
        diffuseColor: BABYLON.Color3;
        specularColor: BABYLON.Color3;
        specularPower: number;
        private _disableLighting;
        disableLighting: boolean;
        private _maxSimultaneousLights;
        maxSimultaneousLights: number;
        private _renderId;
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
    /** @hidden */
    export var waterPixelShader: {
        name: string;
        shader: string;
    };
}
declare module BABYLON {
    /** @hidden */
    export var waterVertexShader: {
        name: string;
        shader: string;
    };
}
declare module BABYLON {
    export class WaterMaterial extends BABYLON.PushMaterial {
        renderTargetSize: BABYLON.Vector2;
        private _bumpTexture;
        bumpTexture: BABYLON.BaseTexture;
        diffuseColor: BABYLON.Color3;
        specularColor: BABYLON.Color3;
        specularPower: number;
        private _disableLighting;
        disableLighting: boolean;
        private _maxSimultaneousLights;
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
        /**
         * @param {boolean}: Add a smaller moving bump to less steady waves.
         */
        private _bumpSuperimpose;
        bumpSuperimpose: boolean;
        /**
         * @param {boolean}: Color refraction and reflection differently with .waterColor2 and .colorBlendFactor2. Non-linear (physically correct) fresnel.
         */
        private _fresnelSeparate;
        fresnelSeparate: boolean;
        /**
         * @param {boolean}: bump Waves modify the reflection.
         */
        private _bumpAffectsReflection;
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
        private _mesh;
        private _refractionRTT;
        private _reflectionRTT;
        private _reflectionTransform;
        private _lastTime;
        private _lastDeltaTime;
        private _renderId;
        private _useLogarithmicDepth;
        private _waitingRenderList;
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
        private _createRenderTargets;
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