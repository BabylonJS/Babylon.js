#include<samplerFragmentDeclaration>(_DEFINENAME_,BASE_COLOR,_VARYINGNAME_,BaseColor,_SAMPLERNAME_,baseColor)
#include<samplerFragmentDeclaration>(_DEFINENAME_,BASE_WEIGHT,_VARYINGNAME_,BaseWeight,_SAMPLERNAME_,baseWeight)
#include<samplerFragmentDeclaration>(_DEFINENAME_,BASE_DIFFUSE_ROUGHNESS,_VARYINGNAME_,BaseDiffuseRoughness,_SAMPLERNAME_,baseDiffuseRoughness)
#include<samplerFragmentDeclaration>(_DEFINENAME_,METALLIC_ROUGHNESS,_VARYINGNAME_,BaseMetalRough,_SAMPLERNAME_,baseMetalRough)
#include<samplerFragmentDeclaration>(_DEFINENAME_,SPECULAR_WEIGHT,_VARYINGNAME_,SpecularWeight,_SAMPLERNAME_,specularWeight)
#include<samplerFragmentDeclaration>(_DEFINENAME_,SPECULAR_COLOR,_VARYINGNAME_,SpecularColor,_SAMPLERNAME_,specularColor)
#include<samplerFragmentDeclaration>(_DEFINENAME_,GEOMETRY_OPACITY,_VARYINGNAME_,GeometryOpacity,_SAMPLERNAME_,geometryOpacity)
#include<samplerFragmentDeclaration>(_DEFINENAME_,EMISSION,_VARYINGNAME_,Emission,_SAMPLERNAME_,emission)

#include<samplerFragmentDeclaration>(_DEFINENAME_,AMBIENT_OCCLUSION,_VARYINGNAME_,AmbientOcclusion,_SAMPLERNAME_,ambientOcclusion)
#include<samplerFragmentDeclaration>(_DEFINENAME_,DECAL,_VARYINGNAME_,Decal,_SAMPLERNAME_,decal)
#include<samplerFragmentDeclaration>(_DEFINENAME_,LIGHTMAP,_VARYINGNAME_,Lightmap,_SAMPLERNAME_,lightmap)


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

#ifdef IBL_CDF_FILTERING
    var icdfSamplerSampler: sampler;
    var icdfSampler: texture_2d<f32>;
#endif