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

	uniform vec2 vMicrosurfaceTextureLods;
	uniform vec4 vReflectivityColor;
	uniform vec3 vEmissiveColor;
	uniform vec4 opacityParts;
	uniform vec4 emissiveLeftColor;
	uniform vec4 emissiveRightColor;

	uniform vec4 vOverloadedIntensity;
	uniform vec3 vOverloadedAmbient;
	uniform vec3 vOverloadedAlbedo;
	uniform vec3 vOverloadedReflectivity;
	uniform vec3 vOverloadedEmissive;
	uniform vec3 vOverloadedReflection;
	uniform vec3 vOverloadedMicroSurface;
	uniform vec4 vOverloadedShadowIntensity;

	uniform float pointSize;
};

uniform Scene {
	mat4 viewProjection;
	mat4 view;
};