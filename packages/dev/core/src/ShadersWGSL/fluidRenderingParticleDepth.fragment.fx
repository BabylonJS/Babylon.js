uniform projection: mat4x4f;

varying uv: vec2f;
varying viewPos: vec3f;
varying sphereRadius: f32;

#ifdef FLUIDRENDERING_VELOCITY
    varying velocityNorm: f32;
#endif

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
    var normalxy: vec2f = input.uv * 2.0 - 1.0;
    var r2: f32 = dot(normalxy, normalxy);
    if (r2 > 1.0) {
        discard;
    }
    var normal: vec3f = vec3f(normalxy, sqrt(1.0 - r2));
#ifndef FLUIDRENDERING_RHS
    normal.z = -normal.z;
#endif

    var realViewPos: vec4f = vec4f(input.viewPos + normal * input.sphereRadius, 1.0);
    var clipSpacePos: vec4f = uniforms.projection * realViewPos;

    fragmentOutputs.fragDepth = clipSpacePos.z / clipSpacePos.w;

#ifdef FLUIDRENDERING_RHS
    realViewPos.z = -realViewPos.z;
#endif

#ifdef FLUIDRENDERING_VELOCITY
    fragmentOutputs.color = vec4f(realViewPos.z, input.velocityNorm, 0., 1.);
#else
    fragmentOutputs.color = vec4f(realViewPos.z, 0., 0., 1.);
#endif
}
