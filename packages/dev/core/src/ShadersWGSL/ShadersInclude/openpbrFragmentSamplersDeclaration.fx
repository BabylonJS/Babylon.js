#include<samplerFragmentDeclaration>(_DEFINENAME_,ALBEDO,_VARYINGNAME_,BaseColor,_SAMPLERNAME_,baseColor)
#include<samplerFragmentDeclaration>(_DEFINENAME_,BASE_WEIGHT,_VARYINGNAME_,BaseWeight,_SAMPLERNAME_,baseWeight)
#include<samplerFragmentDeclaration>(_DEFINENAME_,BASE_DIFFUSE_ROUGHNESS,_VARYINGNAME_,BaseDiffuseRoughness,_SAMPLERNAME_,baseDiffuseRoughness)
#include<samplerFragmentDeclaration>(_DEFINENAME_,AMBIENT,_VARYINGNAME_,Ambient,_SAMPLERNAME_,ambient)
#include<samplerFragmentDeclaration>(_DEFINENAME_,OPACITY,_VARYINGNAME_,Opacity,_SAMPLERNAME_,opacity)
#include<samplerFragmentDeclaration>(_DEFINENAME_,EMISSIVE,_VARYINGNAME_,Emissive,_SAMPLERNAME_,emissive)
#include<samplerFragmentDeclaration>(_DEFINENAME_,LIGHTMAP,_VARYINGNAME_,Lightmap,_SAMPLERNAME_,lightmap)
#include<samplerFragmentDeclaration>(_DEFINENAME_,REFLECTIVITY,_VARYINGNAME_,Reflectivity,_SAMPLERNAME_,reflectivity)
#include<samplerFragmentDeclaration>(_DEFINENAME_,MICROSURFACEMAP,_VARYINGNAME_,MicroSurfaceSampler,_SAMPLERNAME_,microSurface)
#include<samplerFragmentDeclaration>(_DEFINENAME_,METALLIC_REFLECTANCE,_VARYINGNAME_,MetallicReflectance,_SAMPLERNAME_,metallicReflectance)
#include<samplerFragmentDeclaration>(_DEFINENAME_,REFLECTANCE,_VARYINGNAME_,Reflectance,_SAMPLERNAME_,reflectance)
#include<samplerFragmentDeclaration>(_DEFINENAME_,DECAL,_VARYINGNAME_,Decal,_SAMPLERNAME_,decal)

#ifdef CLEARCOAT
    #include<samplerFragmentDeclaration>(_DEFINENAME_,CLEARCOAT_TEXTURE,_VARYINGNAME_,ClearCoat,_SAMPLERNAME_,clearCoat)
    #include<samplerFragmentAlternateDeclaration>(_DEFINENAME_,CLEARCOAT_TEXTURE_ROUGHNESS,_VARYINGNAME_,ClearCoatRoughness)
    #if defined(CLEARCOAT_TEXTURE_ROUGHNESS)
        var clearCoatRoughnessSamplerSampler: sampler;
        var clearCoatRoughnessSampler: texture_2d<f32>;
    #endif
    #include<samplerFragmentDeclaration>(_DEFINENAME_,CLEARCOAT_BUMP,_VARYINGNAME_,ClearCoatBump,_SAMPLERNAME_,clearCoatBump)
    #include<samplerFragmentDeclaration>(_DEFINENAME_,CLEARCOAT_TINT_TEXTURE,_VARYINGNAME_,ClearCoatTint,_SAMPLERNAME_,clearCoatTint)
#endif

#ifdef IRIDESCENCE
    #include<samplerFragmentDeclaration>(_DEFINENAME_,IRIDESCENCE_TEXTURE,_VARYINGNAME_,Iridescence,_SAMPLERNAME_,iridescence)
    #include<samplerFragmentDeclaration>(_DEFINENAME_,IRIDESCENCE_THICKNESS_TEXTURE,_VARYINGNAME_,IridescenceThickness,_SAMPLERNAME_,iridescenceThickness)
#endif

#ifdef SHEEN
    #include<samplerFragmentDeclaration>(_DEFINENAME_,SHEEN_TEXTURE,_VARYINGNAME_,Sheen,_SAMPLERNAME_,sheen)
    #include<samplerFragmentAlternateDeclaration>(_DEFINENAME_,SHEEN_TEXTURE_ROUGHNESS,_VARYINGNAME_,SheenRoughness)
    #if defined(SHEEN_ROUGHNESS) && defined(SHEEN_TEXTURE_ROUGHNESS)
        var sheenRoughnessSamplerSampler: sampler;
        var sheenRoughnessSampler: texture_2d<f32>;
    #endif
#endif

#ifdef ANISOTROPIC
    #include<samplerFragmentDeclaration>(_DEFINENAME_,ANISOTROPIC_TEXTURE,_VARYINGNAME_,Anisotropy,_SAMPLERNAME_,anisotropy)
#endif

// Reflection
#ifdef REFLECTION
    #ifdef REFLECTIONMAP_3D
        var reflectionSamplerSampler: sampler;
        var reflectionSampler: texture_cube<f32>;

        #ifdef LODBASEDMICROSFURACE
        #else
            var reflectionLowSamplerSampler: sampler;
            var reflectionLowSampler: texture_cube<f32>;
            var reflectionHighSamplerSampler: sampler;
            var reflectionHighSampler: texture_cube<f32>;
        #endif

        #ifdef USEIRRADIANCEMAP
            var irradianceSamplerSampler: sampler;
            var irradianceSampler: texture_cube<f32>;
        #endif
    #else

        var reflectionSamplerSampler: sampler;
        var reflectionSampler: texture_2d<f32>;

        #ifdef LODBASEDMICROSFURACE
        #else
            var reflectionLowSamplerSampler: sampler;
            var reflectionLowSampler: texture_2d<f32>;
            var reflectionHighSamplerSampler: sampler;
            var reflectionHighSampler: texture_2d<f32>;
        #endif

        #ifdef USEIRRADIANCEMAP
            var irradianceSamplerSampler: sampler;
            var irradianceSampler: texture_2d<f32>;
        #endif
    #endif

    #ifdef REFLECTIONMAP_SKYBOX
        varying vPositionUVW: vec3f;
    #else
        #if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)
            varying vDirectionW: vec3f;
        #endif
    #endif
#endif

#ifdef ENVIRONMENTBRDF
    var environmentBrdfSamplerSampler: sampler;
    var environmentBrdfSampler: texture_2d<f32>;
#endif


// SUBSURFACE
#ifdef SUBSURFACE
    #ifdef SS_REFRACTION
        #ifdef SS_REFRACTIONMAP_3D

            var refractionSamplerSampler: sampler;
            var refractionSampler: texture_cube<f32>;

            #ifdef LODBASEDMICROSFURACE
            #else
                var refractionLowSamplerSampler: sampler;
                var refractionLowSampler: texture_cube<f32>;
                var refractionHighSamplerSampler: sampler;
                var refractionHighSampler: texture_cube<f32>;
            #endif
        #else

            var refractionSamplerSampler: sampler;
            var refractionSampler: texture_2d<f32>;

            #ifdef LODBASEDMICROSFURACE
            #else
                var refractionLowSamplerSampler: sampler;
                var refractionLowSampler: texture_2d<f32>;
                var refractionHighSamplerSampler: sampler;
                var refractionHighSampler: texture_2d<f32>;
            #endif
        #endif
    #endif

    #include<samplerFragmentDeclaration>(_DEFINENAME_,SS_THICKNESSANDMASK_TEXTURE,_VARYINGNAME_,Thickness,_SAMPLERNAME_,thickness)
    #include<samplerFragmentDeclaration>(_DEFINENAME_,SS_REFRACTIONINTENSITY_TEXTURE,_VARYINGNAME_,RefractionIntensity,_SAMPLERNAME_,refractionIntensity)
    #include<samplerFragmentDeclaration>(_DEFINENAME_,SS_TRANSLUCENCYINTENSITY_TEXTURE,_VARYINGNAME_,TranslucencyIntensity,_SAMPLERNAME_,translucencyIntensity)
    #include<samplerFragmentDeclaration>(_DEFINENAME_,SS_TRANSLUCENCYCOLOR_TEXTURE,_VARYINGNAME_,TranslucencyColor,_SAMPLERNAME_,translucencyColor)
#endif

#ifdef IBL_CDF_FILTERING
    var icdfSamplerSampler: sampler;
    var icdfSampler: texture_2d<f32>;
#endif