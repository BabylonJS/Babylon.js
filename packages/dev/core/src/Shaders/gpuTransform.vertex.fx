// Attributes
attribute vec3 position;

#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>
#include<morphTargetsVertexGlobalDeclaration>
#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]

// Output
out vec3 outPosition;

// Constants
const mat4 identity = mat4(
    vec4(1.0, 0.0, 0.0, 0.0),
    vec4(0.0, 1.0, 0.0, 0.0),
    vec4(0.0, 0.0, 1.0, 0.0),
    vec4(0.0, 0.0, 0.0, 1.0)
);

void main(void) {
    vec3 positionUpdated = position;
#include<morphTargetsVertexGlobal>
#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]
    mat4 finalWorld = identity;
#include<bonesVertex>
#include<bakedVertexAnimation>
    vec4 worldPos = finalWorld * vec4(positionUpdated, 1.0);
	outPosition = worldPos.xyz;
}