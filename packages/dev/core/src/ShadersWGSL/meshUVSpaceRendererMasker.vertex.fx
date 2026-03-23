attribute uv: vec2f;

varying vUV: vec2f;

@vertex
fn main(input : VertexInputs) -> FragmentInputs {
    vertexOutputs.position =  vec4f( vec2f(vertexInputs.uv.x, vertexInputs.uv.y) * 2.0 - 1.0, 0., 1.0);
    vertexOutputs.vUV = vertexInputs.uv;
}