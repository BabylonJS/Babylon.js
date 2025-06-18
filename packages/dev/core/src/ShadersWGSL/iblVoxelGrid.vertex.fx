attribute position: vec3f;
attribute normal: vec3f;
varying vNormalizedPosition: vec3f;

#include<helperFunctions>
#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>
#include<instancesDeclaration>

#include<morphTargetsVertexGlobalDeclaration>
#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]

uniform invWorldScale: mat4x4f;

flat varying f_swizzle: i32;

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
    vertexOutputs.position = uniforms.invWorldScale * worldPos;

    // Normal transformation copied from pbr.vertex
    var normalUpdated: vec3f = vertexInputs.normal;

    var normalWorld: mat3x3f =  mat3x3f(finalWorld[0].xyz, finalWorld[1].xyz, finalWorld[2].xyz);
    #if defined(INSTANCES) && defined(THIN_INSTANCES)
        var N: vec3<f32> = normalUpdated /  vec3f(dot(normalWorld[0], normalWorld[0]), dot(normalWorld[1], normalWorld[1]), dot(normalWorld[2], normalWorld[2]));
        N = normalize(normalWorld * N);
    #else
        // #ifdef NONUNIFORMSCALING
        //     normalWorld = transposeMat3(inverseMat3(normalWorld));
        // #endif
normalWorld = transposeMat3(inverseMat3(normalWorld));
        var N: vec3<f32> = normalize(normalWorld * normalUpdated);
    #endif
    
    // Check the direction that maximizes the rasterized area and swizzle as appropriate.
    N = abs(N);
    if (N.x > N.y && N.x > N.z) {
        vertexOutputs.f_swizzle = 0;
        vertexOutputs.position = vec4f(vertexOutputs.position.y, vertexOutputs.position.z, vertexOutputs.position.x, 1.0);
    } else if (N.y > N.z) {
        vertexOutputs.f_swizzle = 1;
        vertexOutputs.position = vec4f(vertexOutputs.position.z, vertexOutputs.position.x, vertexOutputs.position.y, 1.0);
    } else {
        vertexOutputs.f_swizzle = 2;
    }

    // Normalized position from -1,1 -> 0,1
    vertexOutputs.vNormalizedPosition = vertexOutputs.position.xyz * 0.5 + 0.5;
    vertexOutputs.position.z = vertexOutputs.vNormalizedPosition.z; // Dx11, Metal and Vulkan use a depth range of 0-1.
    
//  vertexOutputs.vNormalizedPosition *= 64.0;
    // #ifdef IS_NDC_HALF_ZRANGE
    //     vertexOutputs.position = vec4f(vertexOutputs.position.x, vertexOutputs.position.y, vertexOutputs.position.z * 0.5 + 0.5, vertexOutputs.position.w);
    // #endif
}
