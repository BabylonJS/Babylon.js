attribute vec3 position;

varying vec3 vNormalizedPosition;

#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>
#include<instancesDeclaration>

#include<morphTargetsVertexGlobalDeclaration>
#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]

uniform mat4 invWorldScale;
uniform mat4 viewMatrix;

void main(void) {
	vec3 positionUpdated = position;

    #include<morphTargetsVertexGlobal>
    #include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]

    #include<instancesVertex>

    #include<bonesVertex>
    #include<bakedVertexAnimation>

	vec4 worldPos = finalWorld * vec4(positionUpdated, 1.0);

    // inverse scale this by world scale to put in 0-1 space.
    gl_Position = viewMatrix * invWorldScale * worldPos;
    // gl_Position.xyz = gl_Position.zyx;
    vNormalizedPosition.xyz = gl_Position.xyz * 0.5 + 0.5;
    // vNormalizedPosition.xyz = vNormalizedPosition.zyx;
    #ifdef IS_NDC_HALF_ZRANGE
        gl_Position.z = gl_Position.z * 0.5 + 0.5;
    #endif
}