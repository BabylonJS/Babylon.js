uniform mat4 view;
uniform mat4 viewProjection;
uniform vec4 vEyePosition;
#ifdef MULTIVIEW
	mat4 viewProjectionR;
#endif

#ifdef BASE_COLOR
uniform vec2 vBaseColorInfos;
uniform mat4 baseColorMatrix;
#endif

#ifdef BASE_WEIGHT
uniform mat4 baseWeightMatrix;
uniform vec2 vBaseWeightInfos;
#endif

uniform float vBaseDiffuseRoughness;
#ifdef BASE_DIFFUSE_ROUGHNESS
uniform mat4 baseDiffuseRoughnessMatrix;
uniform vec2 vBaseDiffuseRoughnessInfos;
#endif

#ifdef AMBIENT_OCCLUSION
uniform vec2 vAmbientOcclusionInfos;
uniform mat4 ambientOcclusionMatrix;
#endif

#ifdef EMISSION_COLOR
uniform vec2 vEmissionColorInfos;
uniform mat4 emissionColorMatrix;
#endif

#ifdef LIGHTMAP
uniform vec2 vLightmapInfos;
uniform mat4 lightmapMatrix;
#endif

#ifdef BASE_METALNESS
uniform vec2 vBaseMetalnessInfos;
uniform mat4 baseMetalnessMatrix;
#endif

#ifdef SPECULAR_WEIGHT
uniform vec2 vSpecularWeightInfos;
uniform mat4 specularWeightMatrix;
#endif

#ifdef SPECULAR_COLOR
uniform vec2 vSpecularColorInfos;
uniform mat4 specularColorMatrix;
#endif

#ifdef SPECULAR_ROUGHNESS
uniform vec2 vSpecularRoughnessInfos;
uniform mat4 specularRoughnessMatrix;
#endif

#ifdef COAT_WEIGHT
uniform vec2 vCoatWeightInfos;
uniform mat4 coatWeightMatrix;
#endif

#ifdef COAT_COLOR
uniform vec2 vCoatColorInfos;
uniform mat4 coatColorMatrix;
#endif

#ifdef COAT_ROUGHNESS
uniform vec2 vCoatRoughnessInfos;
uniform mat4 coatRoughnessMatrix;
#endif

#ifdef COAT_ROUGHNESS_ANISOTROPY
uniform vec2 vCoatRoughnessAnisotropyInfos;
uniform mat4 coatRoughnessAnisotropyMatrix;
#endif

#ifdef COAT_IOR
uniform vec2 vCoatIorInfos;
uniform mat4 coatIorMatrix;
#endif

#ifdef COAT_DARKENING
uniform vec2 vCoatDarkeningInfos;
uniform mat4 coatDarkeningMatrix;
#endif

#ifdef GEOMETRY_NORMAL
uniform vec2 vGeometryNormalInfos;
uniform mat4 geometryNormalMatrix;
#endif

#ifdef GEOMETRY_COAT_NORMAL
uniform vec2 vGeometryCoatNormalInfos;
uniform mat4 geometryCoatNormalMatrix;
#endif

#ifdef GEOMETRY_OPACITY
uniform mat4 geometryOpacityMatrix;
uniform vec2 vGeometryOpacityInfos;
#endif

#ifdef POINTSIZE
uniform float pointSize;
#endif

uniform vec4 cameraInfo;

// Reflection
#ifdef REFLECTION
    uniform vec2 vReflectionInfos;
    uniform mat4 reflectionMatrix;
#endif

#ifdef NORMAL
    #if defined(USESPHERICALFROMREFLECTIONMAP) && defined(USESPHERICALINVERTEX)
        #ifdef USESPHERICALFROMREFLECTIONMAP
            #ifdef SPHERICAL_HARMONICS
                uniform vec3 vSphericalL00;
                uniform vec3 vSphericalL1_1;
                uniform vec3 vSphericalL10;
                uniform vec3 vSphericalL11;
                uniform vec3 vSphericalL2_2;
                uniform vec3 vSphericalL2_1;
                uniform vec3 vSphericalL20;
                uniform vec3 vSphericalL21;
                uniform vec3 vSphericalL22;
            #else
                uniform vec3 vSphericalX;
                uniform vec3 vSphericalY;
                uniform vec3 vSphericalZ;
                uniform vec3 vSphericalXX_ZZ;
                uniform vec3 vSphericalYY_ZZ;
                uniform vec3 vSphericalZZ;
                uniform vec3 vSphericalXY;
                uniform vec3 vSphericalYZ;
                uniform vec3 vSphericalZX;
            #endif
        #endif
    #endif
#endif

#ifdef DETAIL
uniform vec4 vDetailInfos;
uniform mat4 detailMatrix;
#endif

#include<decalVertexDeclaration>

#define ADDITIONAL_VERTEX_DECLARATION
