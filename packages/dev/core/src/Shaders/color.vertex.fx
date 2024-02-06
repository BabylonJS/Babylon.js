// Attributes
attribute vec3 position;

#ifdef VERTEXCOLOR
attribute vec4 color;
#endif

#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>

#include<clipPlaneVertexDeclaration>
#include<fogVertexDeclaration>

#ifdef FOG
	uniform mat4 view;
#endif

// Uniforms

#include<instancesDeclaration>
uniform mat4 viewProjection;
#ifdef MULTIVIEW
	uniform mat4 viewProjectionR;
#endif

// Output
#if defined(VERTEXCOLOR) || defined(INSTANCESCOLOR) && defined(INSTANCES)
varying vec4 vColor;
#endif


#define CUSTOM_VERTEX_DEFINITIONS

void main(void) {

#define CUSTOM_VERTEX_MAIN_BEGIN

#include<instancesVertex>
#include<bonesVertex>
#include<bakedVertexAnimation>
    vec4 worldPos = finalWorld * vec4(position, 1.0);

#ifdef MULTIVIEW
	if (gl_ViewID_OVR == 0u) {
		gl_Position = viewProjection * worldPos;
	} else {
		gl_Position = viewProjectionR * worldPos;
	}
#else
	gl_Position = viewProjection * worldPos;
#endif

#include<clipPlaneVertex>
#include<fogVertex>

#include<vertexColorMixing>

#define CUSTOM_VERTEX_MAIN_END
}