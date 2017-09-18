layout(std140, column_major) uniform;

uniform Material
{
	uniform vec2 vAlbedoInfos;
	uniform vec3 vAmbientInfos;
	uniform vec2 vOpacityInfos;
	uniform vec2 vEmissiveInfos;
	uniform vec2 vLightmapInfos;
	uniform vec3 vReflectivityInfos;
	uniform vec2 vMicroSurfaceSamplerInfos;
	uniform vec4 vRefractionInfos;
	uniform vec2 vReflectionInfos;
	uniform vec3 vBumpInfos;
	uniform mat4 albedoMatrix;
	uniform mat4 ambientMatrix;
	uniform mat4 opacityMatrix;
	uniform mat4 emissiveMatrix;
	uniform mat4 lightmapMatrix;
	uniform mat4 reflectivityMatrix;
	uniform mat4 microSurfaceSamplerMatrix;
	uniform mat4 bumpMatrix;
	uniform vec2 vTangentSpaceParams;
	uniform mat4 refractionMatrix;
	uniform mat4 reflectionMatrix;

	uniform vec3 vReflectionColor;
	uniform vec4 vAlbedoColor;
	uniform vec4 vLightingIntensity;

    uniform vec3 vRefractionMicrosurfaceInfos;
    uniform vec3 vReflectionMicrosurfaceInfos;

	uniform vec4 vReflectivityColor;
	uniform vec3 vEmissiveColor;

	uniform float pointSize;
};

uniform Scene {
	mat4 viewProjection;
	mat4 view;
};