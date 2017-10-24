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
        getAlphaTestTexture(): BaseTexture;
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
        getAlphaTestTexture(): BaseTexture;
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
        getAlphaTestTexture(): BaseTexture;
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
        getAlphaTestTexture(): BaseTexture;
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
        getAlphaTestTexture(): BaseTexture;
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
        getRenderList(): AbstractMesh[];
        readonly renderTargetsEnabled: boolean;
        needAlphaBlending(): boolean;
        needAlphaTesting(): boolean;
        getAlphaTestTexture(): BaseTexture;
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
        diffuseTexture: BaseTexture;
        private _distortionTexture;
        distortionTexture: BaseTexture;
        private _opacityTexture;
        opacityTexture: BaseTexture;
        diffuseColor: Color3;
        speed: number;
        private _scaledDiffuse;
        private _renderId;
        private _lastTime;
        constructor(name: string, scene: Scene);
        needAlphaBlending(): boolean;
        needAlphaTesting(): boolean;
        getAlphaTestTexture(): BaseTexture;
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
        getAlphaTestTexture(): BaseTexture;
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
        getAlphaTestTexture(): BaseTexture;
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
        getAlphaTestTexture(): BaseTexture;
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
        getAlphaTestTexture(): BaseTexture;
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
        protected _attachImageProcessingConfiguration(configuration: ImageProcessingConfiguration): void;
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
        cameraColorGradingTexture: BaseTexture;
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
        getAlphaTestTexture(): BaseTexture;
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


declare module BABYLON {
    /**
     * The Physically based material of BJS.
     *
     * This offers the main features of a standard PBR material.
     * For more information, please refer to the documentation :
     * http://doc.babylonjs.com/extensions/Physically_Based_Rendering
     */
    class LegacyPBRMaterial extends BABYLON.Material {
        /**
         * Intensity of the direct lights e.g. the four lights available in your scene.
         * This impacts both the direct diffuse and specular highlights.
         */
        directIntensity: number;
        /**
         * Intensity of the emissive part of the material.
         * This helps controlling the emissive effect without modifying the emissive color.
         */
        emissiveIntensity: number;
        /**
         * Intensity of the environment e.g. how much the environment will light the object
         * either through harmonics for rough material or through the refelction for shiny ones.
         */
        environmentIntensity: number;
        /**
         * This is a special control allowing the reduction of the specular highlights coming from the
         * four lights of the scene. Those highlights may not be needed in full environment lighting.
         */
        specularIntensity: number;
        private _lightingInfos;
        /**
         * Debug Control allowing disabling the bump map on this material.
         */
        disableBumpMap: boolean;
        /**
         * Debug Control helping enforcing or dropping the darkness of shadows.
         * 1.0 means the shadows have their normal darkness, 0.0 means the shadows are not visible.
         */
        overloadedShadowIntensity: number;
        /**
         * Debug Control helping dropping the shading effect coming from the diffuse lighting.
         * 1.0 means the shade have their normal impact, 0.0 means no shading at all.
         */
        overloadedShadeIntensity: number;
        private _overloadedShadowInfos;
        /**
         * The camera exposure used on this material.
         * This property is here and not in the camera to allow controlling exposure without full screen post process.
         * This corresponds to a photographic exposure.
         */
        cameraExposure: number;
        /**
         * The camera contrast used on this material.
         * This property is here and not in the camera to allow controlling contrast without full screen post process.
         */
        cameraContrast: number;
        /**
         * Color Grading 2D Lookup Texture.
         * This allows special effects like sepia, black and white to sixties rendering style.
         */
        cameraColorGradingTexture: BaseTexture;
        /**
         * The color grading curves provide additional color adjustmnent that is applied after any color grading transform (3D LUT).
         * They allow basic adjustment of saturation and small exposure adjustments, along with color filter tinting to provide white balance adjustment or more stylistic effects.
         * These are similar to controls found in many professional imaging or colorist software. The global controls are applied to the entire image. For advanced tuning, extra controls are provided to adjust the shadow, midtone and highlight areas of the image;
         * corresponding to low luminance, medium luminance, and high luminance areas respectively.
         */
        cameraColorCurves: ColorCurves;
        private _cameraInfos;
        private _microsurfaceTextureLods;
        /**
         * Debug Control allowing to overload the ambient color.
         * This as to be use with the overloadedAmbientIntensity parameter.
         */
        overloadedAmbient: Color3;
        /**
         * Debug Control indicating how much the overloaded ambient color is used against the default one.
         */
        overloadedAmbientIntensity: number;
        /**
         * Debug Control allowing to overload the albedo color.
         * This as to be use with the overloadedAlbedoIntensity parameter.
         */
        overloadedAlbedo: Color3;
        /**
         * Debug Control indicating how much the overloaded albedo color is used against the default one.
         */
        overloadedAlbedoIntensity: number;
        /**
         * Debug Control allowing to overload the reflectivity color.
         * This as to be use with the overloadedReflectivityIntensity parameter.
         */
        overloadedReflectivity: Color3;
        /**
         * Debug Control indicating how much the overloaded reflectivity color is used against the default one.
         */
        overloadedReflectivityIntensity: number;
        /**
         * Debug Control allowing to overload the emissive color.
         * This as to be use with the overloadedEmissiveIntensity parameter.
         */
        overloadedEmissive: Color3;
        /**
         * Debug Control indicating how much the overloaded emissive color is used against the default one.
         */
        overloadedEmissiveIntensity: number;
        private _overloadedIntensity;
        /**
         * Debug Control allowing to overload the reflection color.
         * This as to be use with the overloadedReflectionIntensity parameter.
         */
        overloadedReflection: Color3;
        /**
         * Debug Control indicating how much the overloaded reflection color is used against the default one.
         */
        overloadedReflectionIntensity: number;
        /**
         * Debug Control allowing to overload the microsurface.
         * This as to be use with the overloadedMicroSurfaceIntensity parameter.
         */
        overloadedMicroSurface: number;
        /**
         * Debug Control indicating how much the overloaded microsurface is used against the default one.
         */
        overloadedMicroSurfaceIntensity: number;
        private _overloadedMicroSurface;
        /**
         * AKA Diffuse Texture in standard nomenclature.
         */
        albedoTexture: BaseTexture;
        /**
         * AKA Occlusion Texture in other nomenclature.
         */
        ambientTexture: BaseTexture;
        /**
         * AKA Occlusion Texture Intensity in other nomenclature.
         */
        ambientTextureStrength: number;
        opacityTexture: BaseTexture;
        reflectionTexture: BaseTexture;
        emissiveTexture: BaseTexture;
        /**
         * AKA Specular texture in other nomenclature.
         */
        reflectivityTexture: BaseTexture;
        /**
         * Used to switch from specular/glossiness to metallic/roughness workflow.
         */
        metallicTexture: BaseTexture;
        /**
         * Specifies the metallic scalar of the metallic/roughness workflow.
         * Can also be used to scale the metalness values of the metallic texture.
         */
        metallic: number;
        /**
         * Specifies the roughness scalar of the metallic/roughness workflow.
         * Can also be used to scale the roughness values of the metallic texture.
         */
        roughness: number;
        /**
         * Used to enable roughness/glossiness fetch from a separate chanel depending on the current mode.
         * Gray Scale represents roughness in metallic mode and glossiness in specular mode.
         */
        microSurfaceTexture: BaseTexture;
        bumpTexture: BaseTexture;
        lightmapTexture: BaseTexture;
        refractionTexture: BaseTexture;
        ambientColor: Color3;
        /**
         * AKA Diffuse Color in other nomenclature.
         */
        albedoColor: Color3;
        /**
         * AKA Specular Color in other nomenclature.
         */
        reflectivityColor: Color3;
        reflectionColor: Color3;
        emissiveColor: Color3;
        /**
         * AKA Glossiness in other nomenclature.
         */
        microSurface: number;
        /**
         * source material index of refraction (IOR)' / 'destination material IOR.
         */
        indexOfRefraction: number;
        /**
         * Controls if refraction needs to be inverted on Y. This could be usefull for procedural texture.
         */
        invertRefractionY: boolean;
        opacityFresnelParameters: FresnelParameters;
        emissiveFresnelParameters: FresnelParameters;
        /**
         * This parameters will make the material used its opacity to control how much it is refracting aginst not.
         * Materials half opaque for instance using refraction could benefit from this control.
         */
        linkRefractionWithTransparency: boolean;
        /**
         * The emissive and albedo are linked to never be more than one (Energy conservation).
         */
        linkEmissiveWithAlbedo: boolean;
        useLightmapAsShadowmap: boolean;
        /**
         * In this mode, the emissive informtaion will always be added to the lighting once.
         * A light for instance can be thought as emissive.
         */
        useEmissiveAsIllumination: boolean;
        /**
         * Secifies that the alpha is coming form the albedo channel alpha channel.
         */
        useAlphaFromAlbedoTexture: boolean;
        /**
         * Specifies that the material will keeps the specular highlights over a transparent surface (only the most limunous ones).
         * A car glass is a good exemple of that. When sun reflects on it you can not see what is behind.
         */
        useSpecularOverAlpha: boolean;
        /**
         * Specifies if the reflectivity texture contains the glossiness information in its alpha channel.
         */
        useMicroSurfaceFromReflectivityMapAlpha: boolean;
        /**
         * Specifies if the metallic texture contains the roughness information in its alpha channel.
         */
        useRoughnessFromMetallicTextureAlpha: boolean;
        /**
         * Specifies if the metallic texture contains the roughness information in its green channel.
         */
        useRoughnessFromMetallicTextureGreen: boolean;
        /**
         * Specifies if the metallic texture contains the metallness information in its blue channel.
         */
        useMetallnessFromMetallicTextureBlue: boolean;
        /**
         * Specifies if the metallic texture contains the ambient occlusion information in its red channel.
         */
        useAmbientOcclusionFromMetallicTextureRed: boolean;
        /**
         * Specifies if the ambient texture contains the ambient occlusion information in its red channel only.
         */
        useAmbientInGrayScale: boolean;
        /**
         * In case the reflectivity map does not contain the microsurface information in its alpha channel,
         * The material will try to infer what glossiness each pixel should be.
         */
        useAutoMicroSurfaceFromReflectivityMap: boolean;
        /**
         * Allows to work with scalar in linear mode. This is definitely a matter of preferences and tools used during
         * the creation of the material.
         */
        useScalarInLinearSpace: boolean;
        /**
         * BJS is using an harcoded light falloff based on a manually sets up range.
         * In PBR, one way to represents the fallof is to use the inverse squared root algorythm.
         * This parameter can help you switch back to the BJS mode in order to create scenes using both materials.
         */
        usePhysicalLightFalloff: boolean;
        /**
         * Specifies that the material will keeps the reflection highlights over a transparent surface (only the most limunous ones).
         * A car glass is a good exemple of that. When the street lights reflects on it you can not see what is behind.
         */
        useRadianceOverAlpha: boolean;
        /**
         * Allows using the bump map in parallax mode.
         */
        useParallax: boolean;
        /**
         * Allows using the bump map in parallax occlusion mode.
         */
        useParallaxOcclusion: boolean;
        /**
         * Controls the scale bias of the parallax mode.
         */
        parallaxScaleBias: number;
        /**
         * If sets to true, disables all the lights affecting the material.
         */
        disableLighting: boolean;
        /**
         * Number of Simultaneous lights allowed on the material.
         */
        maxSimultaneousLights: number;
        /**
         * If sets to true, x component of normal map value will invert (x = 1.0 - x).
         */
        invertNormalMapX: boolean;
        /**
         * If sets to true, y component of normal map value will invert (y = 1.0 - y).
         */
        invertNormalMapY: boolean;
        /**
         * If sets to true and backfaceCulling is false, normals will be flipped on the backside.
         */
        twoSidedLighting: boolean;
        private _renderTargets;
        private _globalAmbientColor;
        private _tempColor;
        private _renderId;
        private _defines;
        private _cachedDefines;
        private _useLogarithmicDepth;
        /**
         * Instantiates a new PBRMaterial instance.
         *
         * @param name The material name
         * @param scene The scene the material will be use in.
         */
        constructor(name: string, scene: Scene);
        getClassName(): string;
        useLogarithmicDepth: boolean;
        needAlphaBlending(): boolean;
        needAlphaTesting(): boolean;
        private _shouldUseAlphaFromAlbedoTexture();
        getAlphaTestTexture(): BaseTexture;
        private _checkCache(scene, mesh?, useInstances?);
        private convertColorToLinearSpaceToRef(color, ref);
        private static convertColorToLinearSpaceToRef(color, ref, useScalarInLinear);
        private static _scaledAlbedo;
        private static _scaledReflectivity;
        private static _scaledEmissive;
        private static _scaledReflection;
        static BindLights(scene: Scene, mesh: AbstractMesh, effect: Effect, defines: MaterialDefines, useScalarInLinearSpace: boolean, maxSimultaneousLights: number, usePhysicalLightFalloff: boolean): void;
        isReady(mesh?: AbstractMesh, useInstances?: boolean): boolean;
        buildUniformLayout(): void;
        unbind(): void;
        bindOnlyWorldMatrix(world: Matrix): void;
        private _myScene;
        bind(world: Matrix, mesh?: Mesh): void;
        getAnimatables(): IAnimatable[];
        dispose(forceDisposeEffect?: boolean, forceDisposeTextures?: boolean): void;
        clone(name: string): LegacyPBRMaterial;
        serialize(): any;
        static Parse(source: any, scene: Scene, rootUrl: string): LegacyPBRMaterial;
    }
}
