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
        #define sampleReflection(s, c) textureCube(s, c)

        uniform samplerCube reflectionSampler;

        #ifdef LODBASEDMICROSFURACE
            #define sampleReflectionLod(s, c, l) textureCubeLodEXT(s, c, l)
        #else
            uniform samplerCube reflectionSamplerLow;
            uniform samplerCube reflectionSamplerHigh;
        #endif

        #ifdef USEIRRADIANCEMAP
            uniform samplerCube irradianceSampler;
        #endif
    #else
        #define sampleReflection(s, c) texture2D(s, c)

        uniform sampler2D reflectionSampler;

        #ifdef LODBASEDMICROSFURACE
            #define sampleReflectionLod(s, c, l) texture2DLodEXT(s, c, l)
        #else
            uniform sampler2D reflectionSamplerLow;
            uniform sampler2D reflectionSamplerHigh;
        #endif

        #ifdef USEIRRADIANCEMAP
            uniform sampler2D irradianceSampler;
        #endif
    #endif

    #ifdef REFLECTIONMAP_SKYBOX
        varying vec3 vPositionUVW;
    #else
        #if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)
            varying vec3 vDirectionW;
        #endif
    #endif
#endif

#ifdef ENVIRONMENTBRDF
    uniform sampler2D environmentBrdfSampler;
#endif

#ifdef IBL_CDF_FILTERING
    uniform sampler2D icdfSampler;
#endif