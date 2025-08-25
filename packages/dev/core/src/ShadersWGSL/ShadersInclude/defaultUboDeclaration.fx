uniform diffuseLeftColor: vec4f;
uniform diffuseRightColor: vec4f;
uniform opacityParts: vec4f;
uniform reflectionLeftColor: vec4f;
uniform reflectionRightColor: vec4f;
uniform refractionLeftColor: vec4f;
uniform refractionRightColor: vec4f;
uniform emissiveLeftColor: vec4f;
uniform emissiveRightColor: vec4f;
uniform vDiffuseInfos: vec2f;
uniform vAmbientInfos: vec2f;
uniform vOpacityInfos: vec2f;
uniform vEmissiveInfos: vec2f;
uniform vLightmapInfos: vec2f;
uniform vSpecularInfos: vec2f;
uniform vBumpInfos: vec3f;
uniform diffuseMatrix: mat4x4f;
uniform ambientMatrix: mat4x4f;
uniform opacityMatrix: mat4x4f;
uniform emissiveMatrix: mat4x4f;
uniform lightmapMatrix: mat4x4f;
uniform specularMatrix: mat4x4f;
uniform bumpMatrix: mat4x4f;
uniform vTangentSpaceParams: vec2f;
uniform pointSize: f32;
uniform alphaCutOff: f32;
uniform refractionMatrix: mat4x4f;
uniform vRefractionInfos: vec4f;
uniform vRefractionPosition: vec3f;
uniform vRefractionSize: vec3f;
uniform vSpecularColor: vec4f;
uniform vEmissiveColor: vec3f;
uniform vDiffuseColor: vec4f;
uniform vAmbientColor: vec3f;
uniform cameraInfo: vec4f;
uniform vReflectionInfos: vec2f;
uniform reflectionMatrix: mat4x4f;
uniform vReflectionPosition: vec3f;
uniform vReflectionSize: vec3f;

#define ADDITIONAL_UBO_DECLARATION

#include<sceneUboDeclaration>
#include<meshUboDeclaration>
