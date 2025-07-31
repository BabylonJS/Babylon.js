layout(std140, column_major) uniform;

// layout(set = 0, binding = 0) uniform Harmonics
// {
//     uniform vec3 vSphericalL00;
//     uniform vec3 vSphericalL1_1;
//     uniform vec3 vSphericalL10;
//     uniform vec3 vSphericalL11;
//     uniform vec3 vSphericalL2_2;
//     uniform vec3 vSphericalL2_1;
//     uniform vec3 vSphericalL20;
//     uniform vec3 vSphericalL21;
//     uniform vec3 vSphericalL22;
//     uniform vec3 vSphericalX;
//     uniform vec3 vSphericalY;
//     uniform vec3 vSphericalZ;
//     uniform vec3 vSphericalXX_ZZ;
//     uniform vec3 vSphericalYY_ZZ;
//     uniform vec3 vSphericalZZ;
//     uniform vec3 vSphericalXY;
//     uniform vec3 vSphericalYZ;
//     uniform vec3 vSphericalZX;
// }

uniform Material {
    vec2 vTangentSpaceParams;
    vec4 vLightingIntensity;
    float pointSize;

    vec2 vDebugMode;

    vec4 cameraInfo;

    vec2 vReflectionInfos;
    mat4 reflectionMatrix;
    vec3 vReflectionMicrosurfaceInfos;
    vec3 vReflectionPosition;
    vec3 vReflectionSize;
    vec2 vReflectionFilteringInfo;
    vec3 vReflectionDominantDirection;
    vec3 vReflectionColor;
    
    vec3 vSphericalL00;
    vec3 vSphericalL1_1;
    vec3 vSphericalL10;
    vec3 vSphericalL11;
    vec3 vSphericalL2_2;
    vec3 vSphericalL2_1;
    vec3 vSphericalL20;
    vec3 vSphericalL21;
    vec3 vSphericalL22;

    vec3 vSphericalX;
    vec3 vSphericalY;
    vec3 vSphericalZ;
    vec3 vSphericalXX_ZZ;
    vec3 vSphericalYY_ZZ;
    vec3 vSphericalZZ;
    vec3 vSphericalXY;
    vec3 vSphericalYZ;
    vec3 vSphericalZX;

    float vBaseWeight;
    vec4 vBaseColor;
    float vBaseDiffuseRoughness;
    vec4 vReflectanceInfo;
    vec4 vSpecularColor;
    float vCoatWeight;
    vec3 vCoatColor;
    float vCoatRoughness;
    float vCoatIor;
    vec3 vEmissionColor;

    vec2 vBaseWeightInfos;
    mat4 baseWeightMatrix;
    vec2 vBaseColorInfos;
    mat4 baseColorMatrix;
    vec2 vBaseDiffuseRoughnessInfos;
    mat4 baseDiffuseRoughnessMatrix;
    vec2 vSpecularWeightInfos;
    mat4 specularWeightMatrix;
    vec2 vSpecularColorInfos;
    mat4 specularColorMatrix;
    vec2 vBaseMetalRoughInfos;
    mat4 baseMetalRoughMatrix;
    vec2 vCoatWeightInfos;
    mat4 coatWeightMatrix;
    vec2 vCoatColorInfos;
    mat4 coatColorMatrix;
    vec2 vCoatRoughnessInfos;
    mat4 coatRoughnessMatrix;
    vec2 vGeometryNormalInfos;
    mat4 geometryNormalMatrix;
    vec2 vGeometryCoatNormalInfos;
    mat4 geometryCoatNormalMatrix;
    vec2 vGeometryOpacityInfos;
    mat4 geometryOpacityMatrix;
    vec2 vEmissionColorInfos;
    mat4 emissionColorMatrix;
    vec2 vAmbientOcclusionInfos;
    mat4 ambientOcclusionMatrix;

#define ADDITIONAL_UBO_DECLARATION
};

#include<sceneUboDeclaration>
#include<meshUboDeclaration>
