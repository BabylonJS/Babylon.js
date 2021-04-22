layout(std140, column_major) uniform;

uniform Material
{
	vec4 diffuseLeftColor;
	vec4 diffuseRightColor;
	vec4 opacityParts;
	vec4 reflectionLeftColor;
	vec4 reflectionRightColor;
	vec4 refractionLeftColor;
	vec4 refractionRightColor;
	vec4 emissiveLeftColor; 
	vec4 emissiveRightColor;
	vec2 vDiffuseInfos;
	vec2 vAmbientInfos;
	vec2 vOpacityInfos;
	vec2 vReflectionInfos;
	vec3 vReflectionPosition;
	vec3 vReflectionSize;
	vec2 vEmissiveInfos;
	vec2 vLightmapInfos;
	vec2 vSpecularInfos;
	vec3 vBumpInfos;
	mat4 diffuseMatrix;
	mat4 ambientMatrix;
	mat4 opacityMatrix;
	mat4 reflectionMatrix;
	mat4 emissiveMatrix;
	mat4 lightmapMatrix;
	mat4 specularMatrix;
	mat4 bumpMatrix; 
	vec2 vTangentSpaceParams;
	float pointSize;
    float alphaCutOff;
	mat4 refractionMatrix;
	vec4 vRefractionInfos;
	vec3 vRefractionPosition;
	vec3 vRefractionSize;
	vec4 vSpecularColor;
	vec3 vEmissiveColor;
	vec4 vDiffuseColor;
	vec3 vAmbientColor;

	vec4 vDetailInfos;
	mat4 detailMatrix;
};

#include<sceneUboDeclaration>
#include<meshUboDeclaration>
