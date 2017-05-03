// Attributes
attribute vec3 position;

#ifdef VERTEXCOLOR
attribute vec4 color;
#endif

#include<bonesDeclaration>

// Uniforms
uniform mat4 viewProjection;
uniform mat4 world;

// Output
#ifdef VERTEXCOLOR
varying vec4 vColor;
#endif

void main(void) {
    mat4 finalWorld = world;
#include<bonesVertex>
	gl_Position = viewProjection * finalWorld * vec4(position, 1.0);

#ifdef VERTEXCOLOR
	// Vertex color
	vColor = color;
#endif
}