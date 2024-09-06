varying vNormalizedPosition: vec3f;

uniform nearPlane: f32;
uniform farPlane: f32;
uniform stepSize: f32;

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
    var normPos: vec3f = input.vNormalizedPosition.xyz;
    if (normPos.z < uniforms.nearPlane || normPos.z > uniforms.farPlane) {
        discard;
    }

    fragmentOutputs.fragData0 = select(vec4f(0.0), vec4f(1.0), normPos.z < uniforms.nearPlane + uniforms.stepSize);
    fragmentOutputs.fragData1 = select(vec4f(0.0), vec4f(1.0), normPos.z >= uniforms.nearPlane + uniforms.stepSize && normPos.z < uniforms.nearPlane + 2.0 * uniforms.stepSize);
    fragmentOutputs.fragData2 = select(vec4f(0.0), vec4f(1.0), normPos.z >= uniforms.nearPlane + 2.0 * uniforms.stepSize && normPos.z < uniforms.nearPlane + 3.0 * uniforms.stepSize);
    fragmentOutputs.fragData3 = select(vec4f(0.0), vec4f(1.0), normPos.z >= uniforms.nearPlane + 3.0 * uniforms.stepSize && normPos.z < uniforms.nearPlane + 4.0 * uniforms.stepSize);
#if MAX_DRAW_BUFFERS > 4
    fragmentOutputs.fragData4 = select(vec4f(0.0), vec4f(1.0), normPos.z >= uniforms.nearPlane + 4.0 * uniforms.stepSize && normPos.z < uniforms.nearPlane + 5.0 * uniforms.stepSize);
    fragmentOutputs.fragData5 = select(vec4f(0.0), vec4f(1.0), normPos.z >= uniforms.nearPlane + 5.0 * uniforms.stepSize && normPos.z < uniforms.nearPlane + 6.0 * uniforms.stepSize);
    fragmentOutputs.fragData6 = select(vec4f(0.0), vec4f(1.0), normPos.z >= uniforms.nearPlane + 6.0 * uniforms.stepSize && normPos.z < uniforms.nearPlane + 7.0 * uniforms.stepSize);
    fragmentOutputs.fragData7 = select(vec4f(0.0), vec4f(1.0), normPos.z >= uniforms.nearPlane + 7.0 * uniforms.stepSize && normPos.z < uniforms.nearPlane + 8.0 * uniforms.stepSize);
#endif
}