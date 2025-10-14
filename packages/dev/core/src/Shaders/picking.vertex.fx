// Attributes
attribute vec3 position;
#if defined(INSTANCES)
attribute float instanceMeshID;
#endif

#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>
#include<morphTargetsVertexGlobalDeclaration>
#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]

// Uniforms

#include<instancesDeclaration>
uniform mat4 viewProjection;

// Output
#if defined(INSTANCES)
varying float vMeshID;
#endif

void main(void) {
    
#include<morphTargetsVertexGlobal>
#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]
#include<instancesVertex>
#include<bonesVertex>
#include<bakedVertexAnimation>
    vec4 worldPos = finalWorld * vec4(position, 1.0);
	gl_Position = viewProjection * worldPos;

#if defined(INSTANCES)
    vMeshID = instanceMeshID;
#endif
}
