/* eslint-disable @typescript-eslint/naming-convention */
const name = "msdfFragmentShader";
const shader = `
var fontAtlas: texture_2d<f32>;
var fontAtlasSampler: sampler;
uniform unitRange: vec2f;
uniform texelSize: vec2f;
uniform uColor: vec4f;
uniform thickness: f32;

varying atlasUV: vec2f;

fn median(msdf: vec3<f32>) -> f32 {
    let a = min(msdf.r, msdf.g);
    let b = max(msdf.r, msdf.g);
    return max(a, min(b, msdf.b));
}

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
    let uv = input.atlasUV;

    // Sample center and neighbors
    let sdfCenter = textureSample(fontAtlas, fontAtlasSampler, uv).rgb;
    let sdfLeft   = textureSample(fontAtlas, fontAtlasSampler, uv - vec2<f32>(uniforms.texelSize.x, 0.0)).rgb;
    let sdfRight  = textureSample(fontAtlas, fontAtlasSampler, uv + vec2<f32>(uniforms.texelSize.x, 0.0)).rgb;
    let sdfTop    = textureSample(fontAtlas, fontAtlasSampler, uv - vec2<f32>(0.0, uniforms.texelSize.y)).rgb;
    let sdfBottom = textureSample(fontAtlas, fontAtlasSampler, uv + vec2<f32>(0.0, uniforms.texelSize.y)).rgb;

    let sdf = (sdfCenter + sdfLeft + sdfRight + sdfTop + sdfBottom) / 5.0;

    let dist = median(sdfCenter);

    // Estimate pixel range in screen space
    let dx = dpdx(uv);
    let dy = dpdy(uv);
    let screenTexSize = vec2<f32>(1.0) / vec2<f32>(length(dx), length(dy));
    let pxRange = max(0.5 * dot(uniforms.unitRange, screenTexSize), 1.0);

    let pxDist = pxRange * (dist - 0.5 + uniforms.thickness);
    let alpha = clamp(pxDist / length(dpdx(pxDist)) + 0.5, 0.0, 1.0);

    fragmentOutputs.color = vec4<f32>(uniforms.uColor.rgb, alpha * uniforms.uColor.a);
}`;

/** @internal */
export const msdfFragmentShader = { name, shader };
