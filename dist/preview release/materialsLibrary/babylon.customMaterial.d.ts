
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
