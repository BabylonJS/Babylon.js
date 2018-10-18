// Attributes
attribute vec3 position;

#ifdef VERTEXCOLOR
attribute vec4 color;
#endif

#include<bonesDeclaration>

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
	gl_Position = viewProjection * finalWorld * vec4(position, 1.0);

#ifdef VERTEXCOLOR
	// Vertex color
	vColor = color;
#endif
}