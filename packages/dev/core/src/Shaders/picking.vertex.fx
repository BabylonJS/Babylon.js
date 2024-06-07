// Attributes
attribute vec3 position;
#if defined(INSTANCES)
attribute vec4 instanceMeshID;
#endif

#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>

// Uniforms

#include<instancesDeclaration>
uniform mat4 viewProjection;

// Output
#if defined(INSTANCES)
varying vec4 vMeshID;
#endif

void main(void) {

#include<instancesVertex>
#include<bonesVertex>
#include<bakedVertexAnimation>
    vec4 worldPos = finalWorld * vec4(position, 1.0);
	gl_Position = viewProjection * worldPos;

#if defined(INSTANCES)
    vMeshID = instanceMeshID;
#endif
}