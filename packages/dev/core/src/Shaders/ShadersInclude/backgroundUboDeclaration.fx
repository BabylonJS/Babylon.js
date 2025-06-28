layout(std140, column_major) uniform;

uniform Material
{
	uniform vec4 vPrimaryColor;
	uniform vec4 vPrimaryColorShadow;
	uniform vec2 vDiffuseInfos;
	uniform mat4 diffuseMatrix;
	uniform float fFovMultiplier;

	uniform float pointSize;
	uniform float shadowLevel;
	uniform float alpha;
	uniform vec3 vBackgroundCenter;
	uniform vec4 vReflectionControl;
	uniform vec2 projectedGroundInfos;

	uniform vec2 vReflectionInfos;
	uniform mat4 reflectionMatrix;
	uniform vec3 vReflectionMicrosurfaceInfos;
};

#include<sceneUboDeclaration>
