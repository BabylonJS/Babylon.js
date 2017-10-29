layout(std140, column_major) uniform;

uniform Material
{
	uniform vec4 vPrimaryColor;
	uniform vec4 vSecondaryColor;
	uniform vec4 vTertiaryColor;
	uniform vec2 vDiffuseInfos;
	uniform vec2 vReflectionInfos;
	uniform mat4 diffuseMatrix;
	uniform mat4 reflectionMatrix;
	uniform vec3 vReflectionMicrosurfaceInfos;

	uniform float pointSize;
	uniform float shadowLevel;
	uniform float alpha;
};

uniform Scene {
	mat4 viewProjection;
	mat4 view;
};