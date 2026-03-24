var fontAtlas: texture_2d<f32>;
var fontAtlasSampler: sampler;
uniform uColor: vec4f;
uniform thickness: f32;
uniform uStrokeColor: vec4f;
uniform uStrokeInsetWidth: f32;
uniform uStrokeOutsetWidth: f32;

varying atlasUV: vec2f;

fn median(msdf: vec3<f32>) -> f32 {
    let a = min(msdf.r, msdf.g);
    let b = max(msdf.r, msdf.g);
    return max(a, min(b, msdf.b));
}

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
    let s = textureSample(fontAtlas, fontAtlasSampler, input.atlasUV).rgb;
    let sigDist = median(s) - 0.5 + uniforms.thickness;

    // Floor afwidth to avoid NaN/Inf when sigDist is constant across a derivative quad
    // (happens at high atlas->screen upsample where neighboring fragments hit the same texel).
    let afwidth = max(length(vec2<f32>(dpdx(sigDist), dpdy(sigDist))), 0.0001);
    let alpha = clamp(sigDist / afwidth + 0.5, 0.0, 1.0);

    let sigDistOutset = sigDist + uniforms.uStrokeOutsetWidth * 0.5;
    let sigDistInset = sigDist - uniforms.uStrokeInsetWidth * 0.5;

    let afwidthOutset = max(length(vec2<f32>(dpdx(sigDistOutset), dpdy(sigDistOutset))), 0.0001);
    let afwidthInset = max(length(vec2<f32>(dpdx(sigDistInset), dpdy(sigDistInset))), 0.0001);

    let outset = clamp(sigDistOutset / afwidthOutset + 0.5, 0.0, 1.0);
    let inset = 1.0 - clamp(sigDistInset / afwidthInset + 0.5, 0.0, 1.0);

    let border = outset * inset;

    let filledFragColor = vec4<f32>(uniforms.uColor.rgb, alpha * uniforms.uColor.a);
    let strokedFragColor = vec4<f32>(uniforms.uStrokeColor.rgb, border * uniforms.uStrokeColor.a);

    fragmentOutputs.color = mix(filledFragColor, strokedFragColor, border);
}