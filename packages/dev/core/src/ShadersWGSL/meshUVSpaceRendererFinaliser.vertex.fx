// Attributes
attribute position: vec3f;
attribute uv: vec2f;

// Uniforms
uniform worldViewProjection: mat4x4f;

// Varyings
varying vUV: vec2f;

@vertex
fn main(input : VertexInputs) -> FragmentInputs {
    vertexOutpus.position = uniforms.worldViewProjection *  vec4f(input.position, 1.0);
    vertexOutpus.positionvUV = uv;
}
