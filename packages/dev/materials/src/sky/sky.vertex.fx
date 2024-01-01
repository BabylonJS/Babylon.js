precision highp float;

// Attributes
attribute vec3 position;

#ifdef VERTEXCOLOR
attribute vec4 color;
#endif

// Uniforms
uniform mat4 world;
uniform mat4 view;
uniform mat4 viewProjection;

#ifdef POINTSIZE
uniform float pointSize;
#endif

// Output
varying vec3 vPositionW;

#ifdef VERTEXCOLOR
varying vec4 vColor;
#endif

#include<logDepthDeclaration>
#include<clipPlaneVertexDeclaration>
#include<fogVertexDeclaration>


#define CUSTOM_VERTEX_DEFINITIONS

void main(void) {

#define CUSTOM_VERTEX_MAIN_BEGIN

	gl_Position = viewProjection * world * vec4(position, 1.0);
	
	vec4 worldPos = world * vec4(position, 1.0);
	vPositionW = vec3(worldPos);

	// Clip plane
#include<clipPlaneVertex>

#include<logDepthVertex>

	// Fog
#include<fogVertex>

	// Vertex color
#ifdef VERTEXCOLOR
	vColor = color;
#endif

	// Point size
#if defined(POINTSIZE) && !defined(WEBGPU)
	gl_PointSize = pointSize;
#endif

#define CUSTOM_VERTEX_MAIN_END
}
