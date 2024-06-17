// Attributes
attribute vec3 position;

#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>
#include<morphTargetsVertexGlobalDeclaration>
#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]

// Uniforms
#include<instancesDeclaration>

// Output
out vec3 outPosition;

void main(void) {
    
#include<morphTargetsVertexGlobal>
#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]
#include<instancesVertex>
#include<bonesVertex>
#include<bakedVertexAnimation>
    vec4 worldPos = finalWorld * vec4(position, 1.0);
	outPosition = position.xyz;
}