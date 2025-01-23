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
    vec2 vAlbedoInfos;
    vec4 vAmbientInfos;
    vec2 vOpacityInfos;
    vec2 vEmissiveInfos;
    vec2 vLightmapInfos;
    vec3 vReflectivityInfos;
    vec2 vMicroSurfaceSamplerInfos;
    vec2 vReflectionInfos;
    vec2 vReflectionFilteringInfo;
    vec3 vReflectionPosition;
    vec3 vReflectionSize;
    vec3 vBumpInfos;
    mat4 albedoMatrix;
    mat4 ambientMatrix;
    mat4 opacityMatrix;
    mat4 emissiveMatrix;
    mat4 lightmapMatrix;
    mat4 reflectivityMatrix;
    mat4 microSurfaceSamplerMatrix;
    mat4 bumpMatrix;
    vec2 vTangentSpaceParams;
    mat4 reflectionMatrix;
    vec3 vReflectionColor;
    vec4 vAlbedoColor;
    vec4 vLightingIntensity;
    vec3 vReflectionMicrosurfaceInfos;
    float pointSize;
    vec4 vReflectivityColor;
    vec3 vEmissiveColor;
    vec3 vAmbientColor;

    vec2 vDebugMode;

    vec4 vMetallicReflectanceFactors;
    vec2 vMetallicReflectanceInfos;
    mat4 metallicReflectanceMatrix;
    vec2 vReflectanceInfos;
    mat4 reflectanceMatrix;

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

    #define ADDITIONAL_UBO_DECLARATION
};

#include<sceneUboDeclaration>
#include<meshUboDeclaration>
