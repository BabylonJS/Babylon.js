attribute position: vec3f;

varying vNormalizedPosition: vec3f;

#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>
#include<instancesDeclaration>

#include<morphTargetsVertexGlobalDeclaration>
#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]

uniform invWorldScale: mat4x4f;
uniform viewMatrix: mat4x4f;

@vertex
fn main(input : VertexInputs) -> FragmentInputs {
	var positionUpdated = vertexInputs.position;

    #include<morphTargetsVertexGlobal>
    #include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]

    #include<instancesVertex>

    #include<bonesVertex>
    #include<bakedVertexAnimation>

	let worldPos = finalWorld * vec4f(positionUpdated, 1.0);

    // inverse scale this by world scale to put in 0-1 space.
    vertexOutputs.position = uniforms.viewMatrix * uniforms.invWorldScale * worldPos;
    // vertexOutputs.position.xyz = vertexOutputs.position.zyx;
    vertexOutputs.vNormalizedPosition = vertexOutputs.position.xyz * 0.5 + 0.5;
    // vNormalizedPosition.xyz = vNormalizedPosition.zyx;

    #ifdef IS_NDC_HALF_ZRANGE
        vertexOutputs.position = vec4f(vertexOutputs.position.x, vertexOutputs.position.y, vertexOutputs.position.z * 0.5 + 0.5, vertexOutputs.position.w);
    #endif
}
