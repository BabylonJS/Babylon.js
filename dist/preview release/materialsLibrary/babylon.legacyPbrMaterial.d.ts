
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
        cameraColorGradingTexture: Nullable<BaseTexture>;
        /**
         * The color grading curves provide additional color adjustmnent that is applied after any color grading transform (3D LUT).
         * They allow basic adjustment of saturation and small exposure adjustments, along with color filter tinting to provide white balance adjustment or more stylistic effects.
         * These are similar to controls found in many professional imaging or colorist software. The global controls are applied to the entire image. For advanced tuning, extra controls are provided to adjust the shadow, midtone and highlight areas of the image;
         * corresponding to low luminance, medium luminance, and high luminance areas respectively.
         */
        cameraColorCurves: Nullable<ColorCurves>;
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
        isReady(mesh?: Nullable<AbstractMesh>, useInstances?: boolean): boolean;
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
