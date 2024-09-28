attribute position: vec3f;
attribute normal: vec3f;

varying vNormalizedPosition: vec3f;

uniform world: mat4x4f;
uniform invWorldScale: mat4x4f;
uniform viewMatrix: mat4x4f;

@vertex
fn main(input : VertexInputs) -> FragmentInputs {
    // inverse scale this by world scale to put in 0-1 space.
    vertexOutputs.position = uniforms.viewMatrix * uniforms.invWorldScale * uniforms.world *  vec4f(input.position, 1.);
    // vertexOutputs.position.xyz = vertexOutputs.position.zyx;
    vertexOutputs.vNormalizedPosition = vertexOutputs.position.xyz * 0.5 + 0.5;
    // vNormalizedPosition.xyz = vNormalizedPosition.zyx;

    #ifdef IS_NDC_HALF_ZRANGE
        vertexOutputs.position = vec4f(vertexOutputs.position.x, vertexOutputs.position.y, vertexOutputs.position.z * 0.5 + 0.5, vertexOutputs.position.w);
    #endif
}