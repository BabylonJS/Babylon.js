/// <reference path="../../../dist/preview release/babylon.d.ts" />
declare module BABYLON {
    /**
     * The Physically based material of BJS.
     *
     * This offers the main features of a standard PBR material.
     * For more information, please refer to the documentation :
     * http://doc.babylonjs.com/extensions/Physically_Based_Rendering
     */
    class PBRMaterial extends BABYLON.Material {
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
        opacityTexture: BaseTexture;
        reflectionTexture: BaseTexture;
        emissiveTexture: BaseTexture;
        /**
         * AKA Specular texture in other nomenclature.
         */
        reflectivityTexture: BaseTexture;
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
        disableLighting: boolean;
        private _renderTargets;
        private _worldViewProjectionMatrix;
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
        private static _lightRadiuses;
        static BindLights(scene: Scene, mesh: AbstractMesh, effect: Effect, defines: MaterialDefines, useScalarInLinearSpace: boolean): void;
        isReady(mesh?: AbstractMesh, useInstances?: boolean): boolean;
        unbind(): void;
        bindOnlyWorldMatrix(world: Matrix): void;
        private _myScene;
        private _myShadowGenerator;
        bind(world: Matrix, mesh?: Mesh): void;
        getAnimatables(): IAnimatable[];
        dispose(forceDisposeEffect?: boolean): void;
        clone(name: string): PBRMaterial;
        serialize(): any;
        static Parse(source: any, scene: Scene, rootUrl: string): PBRMaterial;
        static Glass(name: string, scene: Scene): PBRMaterial;
        static Metal(name: string, scene: Scene): PBRMaterial;
        static Iron(name: string, scene: Scene): PBRMaterial;
        static Copper(name: string, scene: Scene): PBRMaterial;
        static Gold(name: string, scene: Scene): PBRMaterial;
        static Plastic(name: string, scene: Scene): PBRMaterial;
    }
}
