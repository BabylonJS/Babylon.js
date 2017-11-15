/// <reference types="babylonjs"/>

declare module 'babylonjs-materials' { 
    export = BABYLON; 
}

declare module BABYLON {
    class ShadowOnlyMaterial extends PushMaterial {
        private _renderId;
        private _activeLight;
        constructor(name: string, scene: Scene);
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


declare module BABYLON {
    class GradientMaterial extends PushMaterial {
        private _maxSimultaneousLights;
        maxSimultaneousLights: number;
        topColor: Color3;
        topColorAlpha: number;
        bottomColor: Color3;
        bottomColorAlpha: number;
        offset: number;
        smoothness: number;
        disableLighting: boolean;
        private _scaledDiffuse;
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


declare module BABYLON {
    class NormalMaterial extends PushMaterial {
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
        clone(name: string): NormalMaterial;
        serialize(): any;
        getClassName(): string;
        static Parse(source: any, scene: Scene, rootUrl: string): NormalMaterial;
    }
}


declare module BABYLON {
    class LavaMaterial extends PushMaterial {
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


declare module BABYLON {
    class SimpleMaterial extends PushMaterial {
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


declare module BABYLON {
    class WaterMaterial extends PushMaterial {
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
        /**
        * Constructor
        */
        constructor(name: string, scene: Scene, renderTargetSize?: Vector2);
        useLogarithmicDepth: boolean;
        readonly refractionTexture: RenderTargetTexture;
        readonly reflectionTexture: RenderTargetTexture;
        addToRenderList(node: any): void;
        enableRenderTargets(enable: boolean): void;
        getRenderList(): Nullable<AbstractMesh[]>;
        readonly renderTargetsEnabled: boolean;
        needAlphaBlending(): boolean;
        needAlphaTesting(): boolean;
        getAlphaTestTexture(): Nullable<BaseTexture>;
        isReadyForSubMesh(mesh: AbstractMesh, subMesh: SubMesh, useInstances?: boolean): boolean;
        bindForSubMesh(world: Matrix, mesh: Mesh, subMesh: SubMesh): void;
        private _createRenderTargets(scene, renderTargetSize);
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


declare module BABYLON {
    class FireMaterial extends PushMaterial {
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


declare module BABYLON {
    class FurMaterial extends PushMaterial {
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


declare module BABYLON {
    class TerrainMaterial extends PushMaterial {
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


declare module BABYLON {
    class TriPlanarMaterial extends PushMaterial {
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


declare module BABYLON {
    class SkyMaterial extends PushMaterial {
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
        private _cameraPosition;
        private _renderId;
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


declare module BABYLON {
    /**
     * The grid materials allows you to wrap any shape with a grid.
     * Colors are customizable.
     */
    class GridMaterial extends BABYLON.PushMaterial {
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
        dispose(forceDisposeEffect?: boolean): void;
        clone(name: string): GridMaterial;
        serialize(): any;
        getClassName(): string;
        static Parse(source: any, scene: Scene, rootUrl: string): GridMaterial;
    }
}


declare module BABYLON {
    class StandardMaterialDefines_OldVer extends MaterialDefines implements IImageProcessingConfigurationDefines {
        DIFFUSE: boolean;
        AMBIENT: boolean;
        OPACITY: boolean;
        OPACITYRGB: boolean;
        REFLECTION: boolean;
        EMISSIVE: boolean;
        SPECULAR: boolean;
        BUMP: boolean;
        PARALLAX: boolean;
        PARALLAXOCCLUSION: boolean;
        SPECULAROVERALPHA: boolean;
        CLIPPLANE: boolean;
        ALPHATEST: boolean;
        ALPHAFROMDIFFUSE: boolean;
        POINTSIZE: boolean;
        FOG: boolean;
        SPECULARTERM: boolean;
        DIFFUSEFRESNEL: boolean;
        OPACITYFRESNEL: boolean;
        REFLECTIONFRESNEL: boolean;
        REFRACTIONFRESNEL: boolean;
        EMISSIVEFRESNEL: boolean;
        FRESNEL: boolean;
        NORMAL: boolean;
        UV1: boolean;
        UV2: boolean;
        VERTEXCOLOR: boolean;
        VERTEXALPHA: boolean;
        NUM_BONE_INFLUENCERS: number;
        BonesPerMesh: number;
        INSTANCES: boolean;
        GLOSSINESS: boolean;
        ROUGHNESS: boolean;
        EMISSIVEASILLUMINATION: boolean;
        LINKEMISSIVEWITHDIFFUSE: boolean;
        REFLECTIONFRESNELFROMSPECULAR: boolean;
        LIGHTMAP: boolean;
        USELIGHTMAPASSHADOWMAP: boolean;
        REFLECTIONMAP_3D: boolean;
        REFLECTIONMAP_SPHERICAL: boolean;
        REFLECTIONMAP_PLANAR: boolean;
        REFLECTIONMAP_CUBIC: boolean;
        REFLECTIONMAP_PROJECTION: boolean;
        REFLECTIONMAP_SKYBOX: boolean;
        REFLECTIONMAP_EXPLICIT: boolean;
        REFLECTIONMAP_EQUIRECTANGULAR: boolean;
        REFLECTIONMAP_EQUIRECTANGULAR_FIXED: boolean;
        REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED: boolean;
        INVERTCUBICMAP: boolean;
        LOGARITHMICDEPTH: boolean;
        REFRACTION: boolean;
        REFRACTIONMAP_3D: boolean;
        REFLECTIONOVERALPHA: boolean;
        TWOSIDEDLIGHTING: boolean;
        SHADOWFLOAT: boolean;
        MORPHTARGETS: boolean;
        MORPHTARGETS_NORMAL: boolean;
        MORPHTARGETS_TANGENT: boolean;
        NUM_MORPH_INFLUENCERS: number;
        IMAGEPROCESSING: boolean;
        VIGNETTE: boolean;
        VIGNETTEBLENDMODEMULTIPLY: boolean;
        VIGNETTEBLENDMODEOPAQUE: boolean;
        TONEMAPPING: boolean;
        CONTRAST: boolean;
        COLORCURVES: boolean;
        COLORGRADING: boolean;
        COLORGRADING3D: boolean;
        SAMPLER3DGREENDEPTH: boolean;
        SAMPLER3DBGRMAP: boolean;
        IMAGEPROCESSINGPOSTPROCESS: boolean;
        EXPOSURE: boolean;
        constructor();
        setReflectionMode(modeToEnable: string): void;
    }
    class StandardMaterial_OldVer extends PushMaterial {
        private _diffuseTexture;
        diffuseTexture: BaseTexture;
        private _ambientTexture;
        ambientTexture: BaseTexture;
        private _opacityTexture;
        opacityTexture: BaseTexture;
        private _reflectionTexture;
        reflectionTexture: BaseTexture;
        private _emissiveTexture;
        emissiveTexture: BaseTexture;
        private _specularTexture;
        specularTexture: BaseTexture;
        private _bumpTexture;
        bumpTexture: BaseTexture;
        private _lightmapTexture;
        lightmapTexture: BaseTexture;
        private _refractionTexture;
        refractionTexture: BaseTexture;
        ambientColor: Color3;
        diffuseColor: Color3;
        specularColor: Color3;
        emissiveColor: Color3;
        specularPower: number;
        private _useAlphaFromDiffuseTexture;
        useAlphaFromDiffuseTexture: boolean;
        private _useEmissiveAsIllumination;
        useEmissiveAsIllumination: boolean;
        private _linkEmissiveWithDiffuse;
        linkEmissiveWithDiffuse: boolean;
        private _useSpecularOverAlpha;
        useSpecularOverAlpha: boolean;
        private _useReflectionOverAlpha;
        useReflectionOverAlpha: boolean;
        private _disableLighting;
        disableLighting: boolean;
        private _useParallax;
        useParallax: boolean;
        private _useParallaxOcclusion;
        useParallaxOcclusion: boolean;
        parallaxScaleBias: number;
        private _roughness;
        roughness: number;
        indexOfRefraction: number;
        invertRefractionY: boolean;
        private _useLightmapAsShadowmap;
        useLightmapAsShadowmap: boolean;
        private _diffuseFresnelParameters;
        diffuseFresnelParameters: FresnelParameters;
        private _opacityFresnelParameters;
        opacityFresnelParameters: FresnelParameters;
        private _reflectionFresnelParameters;
        reflectionFresnelParameters: FresnelParameters;
        private _refractionFresnelParameters;
        refractionFresnelParameters: FresnelParameters;
        private _emissiveFresnelParameters;
        emissiveFresnelParameters: FresnelParameters;
        private _useReflectionFresnelFromSpecular;
        useReflectionFresnelFromSpecular: boolean;
        private _useGlossinessFromSpecularMapAlpha;
        useGlossinessFromSpecularMapAlpha: boolean;
        private _maxSimultaneousLights;
        maxSimultaneousLights: number;
        /**
         * If sets to true, x component of normal map value will invert (x = 1.0 - x).
         */
        private _invertNormalMapX;
        invertNormalMapX: boolean;
        /**
         * If sets to true, y component of normal map value will invert (y = 1.0 - y).
         */
        private _invertNormalMapY;
        invertNormalMapY: boolean;
        /**
         * If sets to true and backfaceCulling is false, normals will be flipped on the backside.
         */
        private _twoSidedLighting;
        twoSidedLighting: boolean;
        /**
         * Default configuration related to image processing available in the standard Material.
         */
        protected _imageProcessingConfiguration: ImageProcessingConfiguration;
        /**
         * Gets the image processing configuration used either in this material.
         */
        /**
         * Sets the Default image processing configuration used either in the this material.
         *
         * If sets to null, the scene one is in use.
         */
        imageProcessingConfiguration: ImageProcessingConfiguration;
        /**
         * Keep track of the image processing observer to allow dispose and replace.
         */
        private _imageProcessingObserver;
        /**
         * Attaches a new image processing configuration to the Standard Material.
         * @param configuration
         */
        protected _attachImageProcessingConfiguration(configuration: Nullable<ImageProcessingConfiguration>): void;
        /**
         * Gets wether the color curves effect is enabled.
         */
        /**
         * Sets wether the color curves effect is enabled.
         */
        cameraColorCurvesEnabled: boolean;
        /**
         * Gets wether the color grading effect is enabled.
         */
        /**
         * Gets wether the color grading effect is enabled.
         */
        cameraColorGradingEnabled: boolean;
        /**
         * Gets wether tonemapping is enabled or not.
         */
        /**
         * Sets wether tonemapping is enabled or not
         */
        cameraToneMappingEnabled: boolean;
        /**
         * The camera exposure used on this material.
         * This property is here and not in the camera to allow controlling exposure without full screen post process.
         * This corresponds to a photographic exposure.
         */
        /**
         * The camera exposure used on this material.
         * This property is here and not in the camera to allow controlling exposure without full screen post process.
         * This corresponds to a photographic exposure.
         */
        cameraExposure: number;
        /**
         * Gets The camera contrast used on this material.
         */
        /**
         * Sets The camera contrast used on this material.
         */
        cameraContrast: number;
        /**
         * Gets the Color Grading 2D Lookup Texture.
         */
        /**
         * Sets the Color Grading 2D Lookup Texture.
         */
        cameraColorGradingTexture: Nullable<BaseTexture>;
        customShaderNameResolve: (shaderName: string, uniforms: string[], uniformBuffers: string[], samplers: string[], defines: StandardMaterialDefines_OldVer) => string;
        protected _renderTargets: SmartArray<RenderTargetTexture>;
        protected _worldViewProjectionMatrix: Matrix;
        protected _globalAmbientColor: Color3;
        protected _useLogarithmicDepth: boolean;
        constructor(name: string, scene: Scene);
        getClassName(): string;
        useLogarithmicDepth: boolean;
        needAlphaBlending(): boolean;
        needAlphaTesting(): boolean;
        protected _shouldUseAlphaFromDiffuseTexture(): boolean;
        getAlphaTestTexture(): BaseTexture;
        /**
         * Child classes can use it to update shaders
         */
        isReadyForSubMesh(mesh: AbstractMesh, subMesh: SubMesh, useInstances?: boolean): boolean;
        buildUniformLayout(): void;
        unbind(): void;
        bindForSubMesh(world: Matrix, mesh: Mesh, subMesh: SubMesh): void;
        getAnimatables(): IAnimatable[];
        getActiveTextures(): BaseTexture[];
        dispose(forceDisposeEffect?: boolean, forceDisposeTextures?: boolean): void;
        clone(name: string): StandardMaterial_OldVer;
        serialize(): any;
        static Parse(source: any, scene: Scene, rootUrl: string): StandardMaterial_OldVer;
        static _DiffuseTextureEnabled: boolean;
        static DiffuseTextureEnabled: boolean;
        static _AmbientTextureEnabled: boolean;
        static AmbientTextureEnabled: boolean;
        static _OpacityTextureEnabled: boolean;
        static OpacityTextureEnabled: boolean;
        static _ReflectionTextureEnabled: boolean;
        static ReflectionTextureEnabled: boolean;
        static _EmissiveTextureEnabled: boolean;
        static EmissiveTextureEnabled: boolean;
        static _SpecularTextureEnabled: boolean;
        static SpecularTextureEnabled: boolean;
        static _BumpTextureEnabled: boolean;
        static BumpTextureEnabled: boolean;
        static _LightmapTextureEnabled: boolean;
        static LightmapTextureEnabled: boolean;
        static _RefractionTextureEnabled: boolean;
        static RefractionTextureEnabled: boolean;
        static _ColorGradingTextureEnabled: boolean;
        static ColorGradingTextureEnabled: boolean;
        static _FresnelEnabled: boolean;
        static FresnelEnabled: boolean;
    }
    class CustomShaderStructure {
        FragmentStore: string;
        VertexStore: string;
        constructor();
    }
    class ShaderSpecialParts {
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
    class ShaderForVer3_0 extends CustomShaderStructure {
        constructor();
    }
    class StandardShaderVersions {
        static Ver3_0: string;
    }
    class CustomMaterial extends StandardMaterial_OldVer {
        static ShaderIndexer: number;
        CustomParts: ShaderSpecialParts;
        ShaderVersion: CustomShaderStructure;
        _isCreatedShader: boolean;
        _createdShaderName: string;
        _customUniform: string[];
        _newUniforms: string[];
        _newUniformInstances: any[];
        _newSamplerInstances: Texture[];
        AttachAfterBind(mesh: Mesh, effect: Effect): void;
        ReviewUniform(name: string, arr: string[]): string[];
        Builder(shaderName: string, uniforms: string[], uniformBuffers: string[], samplers: string[], defines: StandardMaterialDefines_OldVer): string;
        SelectVersion(ver: string): void;
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


declare module BABYLON {
    class CellMaterial extends PushMaterial {
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
