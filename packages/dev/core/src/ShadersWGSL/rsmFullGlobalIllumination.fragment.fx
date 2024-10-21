/**
 * The implementation is a direct application of the formula found in http://www.klayge.org/material/3_12/GI/rsm.pdf
*/
varying vUV: vec2f;

uniform rsmLightMatrix: mat4x4f;
uniform rsmInfo: vec4f;

var textureSamplerSampler: sampler;
var textureSampler: texture_2d<f32>;

var normalSamplerSampler: sampler;
var normalSampler: texture_2d<f32>;

var rsmPositionW: texture_2d<f32>;

var rsmNormalW: texture_2d<f32>;

var rsmFlux: texture_2d<f32>;

#ifdef TRANSFORM_NORMAL
    uniform invView: mat4x4f;
#endif

fn computeIndirect(p: vec3f, n: vec3f) -> vec3f {
    var indirectDiffuse: vec3f =  vec3f(0.);

    var intensity: f32 = uniforms.rsmInfo.z;
    var edgeArtifactCorrection: f32 = uniforms.rsmInfo.w;

    var texRSM: vec4f = uniforms.rsmLightMatrix *  vec4f(p, 1.);
    texRSM = vec4f(texRSM.xy / texRSM.w, texRSM.z, texRSM.w);
    texRSM = vec4f(texRSM.xy * 0.5 + 0.5, texRSM.z, texRSM.w);

    var width: i32 =  i32(uniforms.rsmInfo.x);
    var height: i32 =  i32(uniforms.rsmInfo.y);

    for (var j: i32 = 0; j < height; j++) {
        for (var i: i32 = 0; i < width; i++) {
            var uv = vec2<i32>(i, j);

            var vplPositionW: vec3f = textureLoad(rsmPositionW, uv, 0).xyz;
            var vplNormalW: vec3f = textureLoad(rsmNormalW, uv, 0).xyz * 2.0 - 1.0;
            var vplFlux: vec3f = textureLoad(rsmFlux, uv, 0).rgb;

            vplPositionW -= vplNormalW * edgeArtifactCorrection; // avar artifacts: voidnull at edges

            var dist2: f32 = dot(vplPositionW - p, vplPositionW - p);

            indirectDiffuse += vplFlux * max(0., dot(n, vplPositionW - p)) * max(0., dot(vplNormalW, p - vplPositionW)) / (dist2 * dist2);
        }
    }

    return clamp(indirectDiffuse * intensity, vec3f(0.0), vec3f(1.0));
}


@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
    var positionW: vec3f = textureSample(textureSampler, textureSamplerSampler, fragmentInputs.vUV).xyz;
    var normalW: vec3f = textureSample(normalSampler, normalSamplerSampler, fragmentInputs.vUV).xyz;

    #ifdef DECODE_NORMAL
        normalW = normalW * 2.0 - 1.0;
    #endif
    #ifdef TRANSFORM_NORMAL
        normalW = (uniforms.invView *  vec4f(normalW, 0.)).xyz;

    #endif

    fragmentOutputs.color = vec4f(computeIndirect(positionW, normalW), 1.0);
}
