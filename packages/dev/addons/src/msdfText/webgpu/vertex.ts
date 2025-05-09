/* eslint-disable @typescript-eslint/naming-convention */
const name = "msdfVertexShader";
const shader = `
attribute offsets: vec2f;
attribute world0: vec4f;
attribute world1: vec4f;
attribute world2: vec4f;
attribute world3: vec4f;
attribute uvs: vec4f;

uniform parentWorld: mat4x4f;
uniform view: mat4x4f;
uniform projection: mat4x4f;

varying atlasUV: vec2f;

@vertex
fn main(input: VertexInputs) -> FragmentInputs {
    let world = mat4x4<f32>(input.world0, input.world1, input.world2, input.world3);
    let localOffset = vec4<f32>(input.offsets - vec2<f32>(0.5, 0.5), 0.0, 1.0);
    let viewPos = (uniforms.view * uniforms.parentWorld * world * localOffset).xyz;
    vertexOutputs.position = uniforms.projection * vec4<f32>(viewPos, 1.0);

    vertexOutputs.atlasUV = vec2<f32>(
        input.uvs.x + input.offsets.x * input.uvs.z,
        input.uvs.y + (1.0 - input.offsets.y) * input.uvs.w
    );
}`;

/** @internal */
export const msdfVertexShader = { name, shader };
