#include<samplerFragmentDeclaration>(_DEFINENAME_,BASE_COLOR,_VARYINGNAME_,BaseColor,_SAMPLERNAME_,baseColor)
#include<samplerFragmentDeclaration>(_DEFINENAME_,BASE_WEIGHT,_VARYINGNAME_,BaseWeight,_SAMPLERNAME_,baseWeight)
#include<samplerFragmentDeclaration>(_DEFINENAME_,BASE_DIFFUSE_ROUGHNESS,_VARYINGNAME_,BaseDiffuseRoughness,_SAMPLERNAME_,baseDiffuseRoughness)
#include<samplerFragmentDeclaration>(_DEFINENAME_,BASE_METALNESS,_VARYINGNAME_,BaseMetalness,_SAMPLERNAME_,baseMetalness)
#include<samplerFragmentDeclaration>(_DEFINENAME_,SPECULAR_WEIGHT,_VARYINGNAME_,SpecularWeight,_SAMPLERNAME_,specularWeight)
#include<samplerFragmentDeclaration>(_DEFINENAME_,SPECULAR_COLOR,_VARYINGNAME_,SpecularColor,_SAMPLERNAME_,specularColor)
#include<samplerFragmentDeclaration>(_DEFINENAME_,SPECULAR_ROUGHNESS,_VARYINGNAME_,SpecularRoughness,_SAMPLERNAME_,specularRoughness)
#include<samplerFragmentDeclaration>(_DEFINENAME_,SPECULAR_ROUGHNESS_ANISOTROPY,_VARYINGNAME_,SpecularRoughnessAnisotropy,_SAMPLERNAME_,specularRoughnessAnisotropy)
#include <samplerFragmentDeclaration>(_DEFINENAME_,TRANSMISSION_WEIGHT,_VARYINGNAME_,TransmissionWeight,_SAMPLERNAME_,transmissionWeight)
#include <samplerFragmentDeclaration>(_DEFINENAME_,TRANSMISSION_COLOR,_VARYINGNAME_,TransmissionColor,_SAMPLERNAME_,transmissionColor)
#include <samplerFragmentDeclaration>(_DEFINENAME_,TRANSMISSION_DEPTH,_VARYINGNAME_,TransmissionDepth,_SAMPLERNAME_,transmissionDepth)
#include <samplerFragmentDeclaration>(_DEFINENAME_,TRANSMISSION_SCATTER,_VARYINGNAME_,TransmissionScatter,_SAMPLERNAME_,transmissionScatter)
#include <samplerFragmentDeclaration>(_DEFINENAME_,TRANSMISSION_DISPERSION_SCALE,_VARYINGNAME_,TransmissionDispersionScale,_SAMPLERNAME_,transmissionDispersionScale)
#include<samplerFragmentDeclaration>(_DEFINENAME_,COAT_WEIGHT,_VARYINGNAME_,CoatWeight,_SAMPLERNAME_,coatWeight)
#include<samplerFragmentDeclaration>(_DEFINENAME_,COAT_COLOR,_VARYINGNAME_,CoatColor,_SAMPLERNAME_,coatColor)
#include<samplerFragmentDeclaration>(_DEFINENAME_,COAT_ROUGHNESS,_VARYINGNAME_,CoatRoughness,_SAMPLERNAME_,coatRoughness)
#include<samplerFragmentDeclaration>(_DEFINENAME_,COAT_ROUGHNESS_ANISOTROPY,_VARYINGNAME_,CoatRoughnessAnisotropy,_SAMPLERNAME_,coatRoughnessAnisotropy)
#include<samplerFragmentDeclaration>(_DEFINENAME_,COAT_DARKENING,_VARYINGNAME_,CoatDarkening,_SAMPLERNAME_,coatDarkening)
#include<samplerFragmentDeclaration>(_DEFINENAME_,FUZZ_WEIGHT,_VARYINGNAME_,FuzzWeight,_SAMPLERNAME_,fuzzWeight)
#include<samplerFragmentDeclaration>(_DEFINENAME_,FUZZ_COLOR,_VARYINGNAME_,FuzzColor,_SAMPLERNAME_,fuzzColor)
#include<samplerFragmentDeclaration>(_DEFINENAME_,FUZZ_ROUGHNESS,_VARYINGNAME_,FuzzRoughness,_SAMPLERNAME_,fuzzRoughness)
#include<samplerFragmentDeclaration>(_DEFINENAME_,GEOMETRY_OPACITY,_VARYINGNAME_,GeometryOpacity,_SAMPLERNAME_,geometryOpacity)
#include<samplerFragmentDeclaration>(_DEFINENAME_,GEOMETRY_TANGENT,_VARYINGNAME_,GeometryTangent,_SAMPLERNAME_,geometryTangent)
#include<samplerFragmentDeclaration>(_DEFINENAME_,GEOMETRY_COAT_TANGENT,_VARYINGNAME_,GeometryCoatTangent,_SAMPLERNAME_,geometryCoatTangent)
#include<samplerFragmentDeclaration>(_DEFINENAME_,GEOMETRY_THICKNESS,_VARYINGNAME_,GeometryThickness,_SAMPLERNAME_,geometryThickness)
#include<samplerFragmentDeclaration>(_DEFINENAME_,EMISSION_COLOR,_VARYINGNAME_,EmissionColor,_SAMPLERNAME_,emissionColor)
#include<samplerFragmentDeclaration>(_DEFINENAME_,THIN_FILM_WEIGHT,_VARYINGNAME_,ThinFilmWeight,_SAMPLERNAME_,thinFilmWeight)
#include<samplerFragmentDeclaration>(_DEFINENAME_,THIN_FILM_THICKNESS,_VARYINGNAME_,ThinFilmThickness,_SAMPLERNAME_,thinFilmThickness)

#include<samplerFragmentDeclaration>(_DEFINENAME_,AMBIENT_OCCLUSION,_VARYINGNAME_,AmbientOcclusion,_SAMPLERNAME_,ambientOcclusion)
#include<samplerFragmentDeclaration>(_DEFINENAME_,DECAL,_VARYINGNAME_,Decal,_SAMPLERNAME_,decal)

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

#ifdef FUZZENVIRONMENTBRDF
    var environmentFuzzBrdfSamplerSampler: sampler;
    var environmentFuzzBrdfSampler: texture_2d<f32>;
#endif

#ifdef REFRACTED_BACKGROUND
    var backgroundRefractionSamplerSampler: sampler;
    var backgroundRefractionSampler: texture_2d<f32>;
#endif

#if defined(ANISOTROPIC) || defined(FUZZ) || defined(REFRACTED_BACKGROUND)
    var blueNoiseSamplerSampler: sampler;
    var blueNoiseSampler: texture_2d<f32>;
#endif

#ifdef IBL_CDF_FILTERING
    var icdfSamplerSampler: sampler;
    var icdfSampler: texture_2d<f32>;
#endif