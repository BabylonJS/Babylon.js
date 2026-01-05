attribute position: vec3f;
attribute uv: vec2f;

uniform viewProjection: mat4x4f;
uniform worldViewProjection: mat4x4f;

// Output
varying vUV: vec2f;

@vertex
fn main(input : VertexInputs) -> FragmentInputs {
    vertexOutputs.position = uniforms.worldViewProjection * vec4f(input.position, 1.0);
    vertexOutputs.vUV = input.uv;
}