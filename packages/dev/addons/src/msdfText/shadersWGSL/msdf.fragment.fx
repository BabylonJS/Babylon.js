var fontAtlas: texture_2d<f32>;
var fontAtlasSampler: sampler;
uniform uColor: vec4f;
uniform thickness: f32;
uniform uStrokeColor: vec4f;
uniform uStrokeInsetWidth: f32;
uniform uStrokeOutsetWidth: f32;
uniform uDepthWrite: f32;

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

    let afwidth = length(vec2<f32>(dpdx(sigDist), dpdy(sigDist)));
    let alpha = clamp(sigDist / afwidth + 0.5, 0.0, 1.0);

    let sigDistOutset = sigDist + uniforms.uStrokeOutsetWidth * 0.5;
    let sigDistInset = sigDist - uniforms.uStrokeInsetWidth * 0.5;

    let afwidthOutset = length(vec2<f32>(dpdx(sigDistOutset), dpdy(sigDistOutset)));
    let afwidthInset = length(vec2<f32>(dpdx(sigDistInset), dpdy(sigDistInset)));

    let outset = clamp(sigDistOutset / afwidthOutset + 0.5, 0.0, 1.0);
    let inset = 1.0 - clamp(sigDistInset / afwidthInset + 0.5, 0.0, 1.0);

    let border = outset * inset;

    // In depth-write mode, hard-cut the coverage (alpha test) so glyphs sort like solid geometry:
    // fully transparent pixels are discarded and the remaining pixels are made opaque, so no
    // semi-transparent edge pixels write depth (which would halo geometry drawn behind them).
    var fillCoverage = alpha;
    var strokeCoverage = border;
    if (uniforms.uDepthWrite > 0.5) {
        if (max(alpha, border) < 0.5) {
            discard;
        }
        fillCoverage = step(0.5, alpha);
        strokeCoverage = step(0.5, border);
    }

    let filledFragColor = vec4<f32>(uniforms.uColor.rgb, fillCoverage * uniforms.uColor.a);
    let strokedFragColor = vec4<f32>(uniforms.uStrokeColor.rgb, strokeCoverage * uniforms.uStrokeColor.a);

    fragmentOutputs.color = mix(filledFragColor, strokedFragColor, strokeCoverage);
}