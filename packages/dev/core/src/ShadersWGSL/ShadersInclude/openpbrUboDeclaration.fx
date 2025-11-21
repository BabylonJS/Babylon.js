
uniform vTangentSpaceParams: vec2f;
uniform vLightingIntensity: vec4f;
uniform pointSize: f32;

uniform vDebugMode: vec2f;

uniform cameraInfo: vec4f;
uniform backgroundRefractionMatrix: mat4x4f;
uniform vBackgroundRefractionInfos: vec3f;

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

uniform vBaseWeight: f32;
uniform vBaseColor: vec4f;
uniform vBaseDiffuseRoughness: f32;
uniform vReflectanceInfo: vec4f;
uniform vSpecularColor: vec4f;
uniform vSpecularAnisotropy: vec3f;
uniform vTransmissionWeight : f32;
uniform vTransmissionColor : vec3f;
uniform vTransmissionDepth : f32;
uniform vTransmissionScatter : vec3f;
uniform vTransmissionScatterAnisotropy : f32;
uniform vTransmissionDispersionScale : f32;
uniform vTransmissionDispersionAbbeNumber : f32;
uniform vCoatWeight: f32;
uniform vCoatColor: vec3f;
uniform vCoatRoughness: f32;
uniform vCoatRoughnessAnisotropy: f32;
uniform vCoatIor: f32;
uniform vCoatDarkening : f32;
uniform vFuzzWeight: f32;
uniform vFuzzColor: vec3f;
uniform vFuzzRoughness: f32;
uniform vGeometryCoatTangent: vec2f;
uniform vGeometryThickness: f32;
uniform vEmissionColor: vec3f;
uniform vThinFilmWeight: f32;
uniform vThinFilmThickness: vec2f;
uniform vThinFilmIor: f32;

uniform vBaseWeightInfos: vec2f;
uniform baseWeightMatrix: mat4x4f;
uniform vBaseColorInfos: vec2f;
uniform baseColorMatrix: mat4x4f;
uniform vBaseDiffuseRoughnessInfos: vec2f;
uniform baseDiffuseRoughnessMatrix: mat4x4f;
uniform vBaseMetalnessInfos: vec2f;
uniform baseMetalnessMatrix: mat4x4f;
uniform vSpecularWeightInfos: vec2f;
uniform specularWeightMatrix: mat4x4f;
uniform vSpecularColorInfos: vec2f;
uniform specularColorMatrix: mat4x4f;
uniform vSpecularRoughnessInfos: vec2f;
uniform specularRoughnessMatrix: mat4x4f;
uniform vSpecularRoughnessAnisotropyInfos: vec2f;
uniform specularRoughnessAnisotropyMatrix: mat4x4f;
uniform vTransmissionWeightInfos : vec2f;
uniform transmissionWeightMatrix : mat4x4f;
uniform vTransmissionColorInfos : vec2f;
uniform transmissionColorMatrix : mat4x4f;
uniform vTransmissionDepthInfos : vec2f;
uniform transmissionDepthMatrix : mat4x4f;
uniform vTransmissionScatterInfos : vec2f;
uniform transmissionScatterMatrix : mat4x4f;
uniform vTransmissionDispersionScaleInfos : vec2f;
uniform transmissionDispersionScaleMatrix : mat4x4f;
uniform vCoatWeightInfos: vec2f;
uniform coatWeightMatrix: mat4x4f;
uniform vCoatColorInfos: vec2f;
uniform coatColorMatrix: mat4x4f;
uniform vCoatRoughnessInfos: vec2f;
uniform coatRoughnessMatrix: mat4x4f;
uniform vCoatRoughnessAnisotropyInfos: vec2f;
uniform coatRoughnessAnisotropyMatrix: mat4x4f;
uniform vCoatDarkeningInfos : vec2f;
uniform coatDarkeningMatrix : mat4x4f;
uniform vFuzzWeightInfos: vec2f;
uniform fuzzWeightMatrix: mat4x4f;
uniform vFuzzColorInfos: vec2f;
uniform fuzzColorMatrix: mat4x4f;
uniform vFuzzRoughnessInfos: vec2f;
uniform fuzzRoughnessMatrix: mat4x4f;
uniform vGeometryNormalInfos: vec2f;
uniform geometryNormalMatrix: mat4x4f;
uniform vGeometryTangentInfos: vec2f;
uniform geometryTangentMatrix: mat4x4f;
uniform vGeometryCoatNormalInfos: vec2f;
uniform geometryCoatNormalMatrix: mat4x4f;
uniform vGeometryCoatTangentInfos: vec2f;
uniform geometryCoatTangentMatrix: mat4x4f;
uniform vGeometryOpacityInfos: vec2f;
uniform geometryOpacityMatrix: mat4x4f;
uniform vGeometryThicknessInfos: vec2f;
uniform geometryThicknessMatrix: mat4x4f;
uniform vEmissionInfos: vec2f;
uniform emissionMatrix: mat4x4f;
uniform vThinFilmWeightInfos: vec2f;
uniform thinFilmWeightMatrix: mat4x4f;
uniform vThinFilmThicknessInfos: vec2f;
uniform thinFilmThicknessMatrix: mat4x4f;
uniform vAmbientOcclusionInfos: vec2f;
uniform ambientOcclusionMatrix: mat4x4f;

#define ADDITIONAL_UBO_DECLARATION


#include<sceneUboDeclaration>
#include<meshUboDeclaration>

