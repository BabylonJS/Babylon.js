/**
 * The implementation is an application of the formula found in http://www.klayge.org/material/3_12/GI/rsm.pdf
 * For better results, it also adds a random (noise) rotation to the RSM samples (the noise artifacts are easier to remove than the banding artifacts).
*/
varying vUV: vec2f;

uniform rsmLightMatrix: mat4x4f;
uniform rsmInfo: vec4f;
uniform rsmInfo2: vec4f;

var textureSamplerSampler: sampler;
var textureSampler: texture_2d<f32>;

var normalSamplerSampler: sampler;
var normalSampler: texture_2d<f32>;

var rsmPositionWSampler: sampler;
var rsmPositionW: texture_2d<f32>;

var rsmNormalWSampler: sampler;
var rsmNormalW: texture_2d<f32>;

var rsmFluxSampler: sampler;
var rsmFlux: texture_2d<f32>;

var rsmSamples: texture_2d<f32>;

#ifdef TRANSFORM_NORMAL
    uniform invView: mat4x4f;
#endif

fn mod289(x: f32) -> f32{
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}
fn mod289Vec4(x: vec4f) -> vec4f {
    return x - floor(x * (1.0 / 289.0))* 289.0;
}
fn perm(x: vec4f) -> vec4f {
    return mod289Vec4(((x * 34.0) + 1.0) * x) ;
}

fn noise(p: vec3f) -> f32{
    var a: vec3f = floor(p);
    var d: vec3f = p - a;
    d = d * d * (3.0 - 2.0 * d);

    var b: vec4f = a.xxyy +  vec4f(0.0, 1.0, 0.0, 1.0);
    var k1: vec4f = perm(b.xyxy);
    var k2: vec4f = perm(k1.xyxy + b.zzww);

    var c: vec4f = k2 + a.zzzz;
    var k3: vec4f = perm(c);
    var k4: vec4f = perm(c + 1.0);

    var o1: vec4f = fract(k3 * (1.0 / 41.0));
    var o2: vec4f = fract(k4 * (1.0 / 41.0));

    var o3: vec4f = o2 * d.z + o1 * (1.0 - d.z);
    var o4: vec2f = o3.yw * d.x + o3.xz * (1.0 - d.x);

    return o4.y * d.y + o4.x * (1.0 - d.y);
}

fn computeIndirect(p: vec3f, n: vec3f) -> vec3f {
    var indirectDiffuse: vec3f =  vec3f(0.);

    var numSamples: i32 =  i32(uniforms.rsmInfo.x);
    var radius: f32 = uniforms.rsmInfo.y;
    var intensity: f32 = uniforms.rsmInfo.z;
    var edgeArtifactCorrection: f32 = uniforms.rsmInfo.w;

    var texRSM: vec4f = uniforms.rsmLightMatrix *  vec4f(p, 1.);
    texRSM = vec4f(texRSM.xy / texRSM.w, texRSM.z, texRSM.w);
    texRSM = vec4f(texRSM.xy * 0.5 + 0.5, texRSM.z, texRSM.w);

    var angle: f32 = noise(p * uniforms.rsmInfo2.x);
    var c: f32 = cos(angle);
    var s: f32 = sin(angle);

    for (var i: i32 = 0; i < numSamples; i++) {
        var rsmSample: vec3f = textureLoad(rsmSamples, vec2<i32>(i, 0), 0).xyz;
        var weightSquare: f32 = rsmSample.z;

        if (uniforms.rsmInfo2.y == 1.0){
            rsmSample = vec3f(rsmSample.x * c + rsmSample.y * s, -rsmSample.x * s + rsmSample.y * c, rsmSample.z);
        }

        var uv: vec2f = texRSM.xy + rsmSample.xy * radius;

        if (uv.x < 0. || uv.x > 1. || uv.y < 0. || uv.y > 1.) {
            continue;
        }

        var vplPositionW: vec3f = textureSampleLevel(rsmPositionW, rsmPositionWSampler, uv, 0.).xyz;
        var vplNormalW: vec3f = textureSampleLevel(rsmNormalW, rsmNormalWSampler, uv, 0.).xyz * 2.0 - 1.0;
        var vplFlux: vec3f = textureSampleLevel(rsmFlux, rsmFluxSampler, uv, 0.).rgb;

        vplPositionW -= vplNormalW * edgeArtifactCorrection; // avvoid artifacts at edges

        var dist2: f32 = dot(vplPositionW - p, vplPositionW - p);

        indirectDiffuse += vplFlux * weightSquare * max(0., dot(n, vplPositionW - p)) * max(0., dot(vplNormalW, p - vplPositionW)) / (dist2 * dist2);
    }

    return clamp(indirectDiffuse * intensity, vec3f(0.0), vec3f(1.0));
}

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {

    var positionW: vec3f = textureSample(textureSampler, textureSamplerSampler, input.vUV).xyz;
    var normalW: vec3f = textureSample(normalSampler, normalSamplerSampler, input.vUV).xyz;
    #ifdef DECODE_NORMAL
        normalW = normalW * 2.0 - 1.0;
    #endif
    #ifdef TRANSFORM_NORMAL
        normalW = (uniforms.invView *  vec4f(normalW, 0.)).xyz;
    #endif

    fragmentOutputs.color = vec4f(computeIndirect(positionW, normalW), 1.0);
}
