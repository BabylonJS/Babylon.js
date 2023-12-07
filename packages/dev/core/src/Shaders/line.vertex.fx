#include<instancesDeclaration>

#include<clipPlaneVertexDeclaration>

// Attributes
attribute vec3 position;
attribute vec4 normal;

// Uniforms
uniform mat4 viewProjection;

uniform float width;
uniform float aspectRatio;

#include<logDepthDeclaration>

#define CUSTOM_VERTEX_DEFINITIONS

void main(void) {

#define CUSTOM_VERTEX_MAIN_BEGIN

    #include<instancesVertex>

    mat4 worldViewProjection = viewProjection * finalWorld;

	vec4 viewPosition = worldViewProjection * vec4(position, 1.0);
	vec4 viewPositionNext = worldViewProjection * vec4(normal.xyz, 1.0);

	vec2 currentScreen = viewPosition.xy / viewPosition.w;
	vec2 nextScreen = viewPositionNext.xy / viewPositionNext.w;

	currentScreen.x *= aspectRatio;
	nextScreen.x *= aspectRatio;

	vec2 dir = normalize(nextScreen - currentScreen);
	vec2 normalDir = vec2(-dir.y, dir.x);

	normalDir *= width / 2.0;
	normalDir.x /= aspectRatio;

	vec4 offset = vec4(normalDir * normal.w, 0.0, 0.0);
	gl_Position = viewPosition + offset;

#if defined(CLIPPLANE) || defined(CLIPPLANE2) || defined(CLIPPLANE3) || defined(CLIPPLANE4) || defined(CLIPPLANE5) || defined(CLIPPLANE6)
    vec4 worldPos = finalWorld * vec4(position, 1.0);
    #include<clipPlaneVertex>
#endif

	#include<logDepthVertex>

#define CUSTOM_VERTEX_MAIN_END

}