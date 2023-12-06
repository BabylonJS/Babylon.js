precision highp float;

// Attributes
attribute vec3 position;
#ifdef NORMAL
attribute vec3 normal;
#endif

#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>

// Uniforms
#include<instancesDeclaration>

uniform mat4 view;
uniform mat4 viewProjection;

#ifdef POINTSIZE
uniform float pointSize;
#endif

// Output
varying vec3 vPositionW;
#ifdef NORMAL
varying vec3 vNormalW;
#endif

#ifdef VERTEXCOLOR
varying vec4 vColor;
#endif


#include<clipPlaneVertexDeclaration>

#include<logDepthDeclaration>
#include<fogVertexDeclaration>
#include<__decl__lightFragment>[0..maxSimultaneousLights]


#define CUSTOM_VERTEX_DEFINITIONS

void main(void) {

#define CUSTOM_VERTEX_MAIN_BEGIN

#include<instancesVertex>
#include<bonesVertex>
#include<bakedVertexAnimation>

	vec4 worldPos = finalWorld * vec4(position, 1.0);

	gl_Position = viewProjection * worldPos;

	vPositionW = vec3(worldPos);

#ifdef NORMAL
	vNormalW = normalize(vec3(finalWorld * vec4(normal, 0.0)));
#endif

	// Clip plane
#include<clipPlaneVertex>

#include<logDepthVertex>

    // Fog
#include<fogVertex>
#include<shadowsVertex>[0..maxSimultaneousLights]

	// Point size
#if defined(POINTSIZE) && !defined(WEBGPU)
	gl_PointSize = pointSize;
#endif

#define CUSTOM_VERTEX_MAIN_END
}
