uniform vAmbientInfos: vec4f;
uniform vOpacityInfos: vec2f;
uniform vEmissiveInfos: vec2f;
uniform vLightmapInfos: vec2f;
uniform vReflectivityInfos: vec3f;
uniform vMicroSurfaceSamplerInfos: vec2f;
uniform vBumpInfos: vec3f;

uniform ambientMatrix: mat4x4f;
uniform opacityMatrix: mat4x4f;
uniform emissiveMatrix: mat4x4f;
uniform lightmapMatrix: mat4x4f;
uniform reflectivityMatrix: mat4x4f;
uniform microSurfaceSamplerMatrix: mat4x4f;
uniform bumpMatrix: mat4x4f;
uniform vTangentSpaceParams: vec2f;
uniform vLightingIntensity: vec4f;
uniform pointSize: f32;
uniform vReflectivityColor: vec4f;
uniform vAmbientColor: vec3f;

uniform vDebugMode: vec2f;

uniform vMetallicReflectanceFactors: vec4f;
uniform vMetallicReflectanceInfos: vec2f;
uniform metallicReflectanceMatrix: mat4x4f;
uniform vReflectanceInfos: vec2f;
uniform reflectanceMatrix: mat4x4f;
uniform cameraInfo: vec4f;

uniform vReflectionInfos: vec2f;
uniform reflectionMatrix: mat4x4f;
uniform vReflectionMicrosurfaceInfos: vec3f;
uniform vReflectionPosition: vec3f;
uniform vReflectionSize: vec3f;
uniform vReflectionFilteringInfo: vec2f;
uniform vReflectionDominantDirection: vec3f;
uniform vReflectionColor: vec3f;

uniform vSphericalL00: vec3f;
uniform vSphericalL1_1: vec3f;
uniform vSphericalL10: vec3f;
uniform vSphericalL11: vec3f;
uniform vSphericalL2_2: vec3f;
uniform vSphericalL2_1: vec3f;
uniform vSphericalL20: vec3f;
uniform vSphericalL21: vec3f;
uniform vSphericalL22: vec3f;

uniform vSphericalX: vec3f;
uniform vSphericalY: vec3f;
uniform vSphericalZ: vec3f;
uniform vSphericalXX_ZZ: vec3f;
uniform vSphericalYY_ZZ: vec3f;
uniform vSphericalZZ: vec3f;
uniform vSphericalXY: vec3f;
uniform vSphericalYZ: vec3f;
uniform vSphericalZX: vec3f;

uniform baseWeight: f32;
uniform vBaseColor: vec4f;
uniform baseDiffuseRoughness: f32;
uniform vEmissiveColor: vec3f;

uniform baseWeightInfos: vec2f;
uniform baseWeightMatrix: mat4x4f;
uniform baseColorInfos: vec2f;
uniform baseColorMatrix: mat4x4f;
uniform baseDiffuseRoughnessInfos: vec2f;
uniform baseDiffuseRoughnessMatrix: mat4x4f;

#define ADDITIONAL_UBO_DECLARATION


#include<sceneUboDeclaration>
#include<meshUboDeclaration>
