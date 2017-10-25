layout(std140, column_major) uniform;

uniform Material
{
	uniform vec4 vPrimaryColor;
	uniform vec4 vSecondaryColor;
	uniform vec4 vThirdColor;
	uniform vec2 vOpacityInfo;
	uniform vec2 vEnvironmentInfo;
	uniform mat4 opacityMatrix;
	uniform mat4 environmentMatrix;
	uniform vec3 vEnvironmentMicrosurfaceInfos;

	uniform float pointSize;
	uniform float shadowLevel;
};

uniform Scene {
	mat4 viewProjection;
	mat4 view;
};