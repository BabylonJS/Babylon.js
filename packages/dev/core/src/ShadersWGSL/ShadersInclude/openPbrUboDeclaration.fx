
uniform vTangentSpaceParams: vec2f;
uniform vLightingIntensity: vec4f;
uniform pointSize: f32;

uniform vDebugMode: vec2f;

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
uniform vBaseDiffuseRoughness: f32;
uniform vReflectanceInfo: vec4f;
uniform vSpecularColor: vec4f;
uniform vCoatWeight: f32;
uniform vCoatColor: vec3f;
uniform vCoatRoughness: f32;
uniform vCoatIor: f32;
uniform vEmissionColor: vec3f;

uniform vBaseWeightInfos: vec2f;
uniform baseWeightMatrix: mat4x4f;
uniform vBaseColorInfos: vec2f;
uniform baseColorMatrix: mat4x4f;
uniform vBaseDiffuseRoughnessInfos: vec2f;
uniform baseDiffuseRoughnessMatrix: mat4x4f;
uniform vSpecularWeightInfos: vec2f;
uniform specularWeightMatrix: mat4x4f;
uniform vSpecularColorInfos: vec2f;
uniform specularColorMatrix: mat4x4f;
uniform vBaseMetalRoughInfos: vec2f;
uniform baseMetalRoughMatrix: mat4x4f;
uniform vCoatWeightInfos: vec2f;
uniform coatWeightMatrix: mat4x4f;
uniform vCoatColorInfos: vec2f;
uniform coatColorMatrix: mat4x4f;
uniform vCoatRoughnessInfos: vec2f;
uniform coatRoughnessMatrix: mat4x4f;
uniform vGeometryNormalInfos: vec2f;
uniform geometryNormalMatrix: mat4x4f;
uniform vGeometryOpacityInfos: vec2f;
uniform geometryOpacityMatrix: mat4x4f;
uniform vEmissionInfos: vec2f;
uniform emissionMatrix: mat4x4f;
uniform vAmbientOcclusionInfos: vec2f;
uniform ambientOcclusionMatrix: mat4x4f;

#define ADDITIONAL_UBO_DECLARATION


#include<sceneUboDeclaration>
#include<meshUboDeclaration>
