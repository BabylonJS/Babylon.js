// Attributes
attribute vec3 position;

#ifdef VERTEXCOLOR
attribute vec4 color;
#endif

#include<bonesDeclaration>

#include<clipPlaneVertexDeclaration>

// Uniforms

#include<instancesDeclaration>
uniform mat4 viewProjection;

// Output
#ifdef VERTEXCOLOR
varying vec4 vColor;
#endif

void main(void) {
#include<instancesVertex>
#include<bonesVertex>
    vec4 worldPos = finalWorld * vec4(position, 1.0);

	gl_Position = viewProjection * worldPos;

#include<clipPlaneVertex>

#ifdef VERTEXCOLOR
	// Vertex color
	vColor = color;
#endif
}