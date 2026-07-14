#extension GL_OES_standard_derivatives : enable

precision highp float;

uniform sampler2D fontAtlas;
uniform vec4 uColor;
uniform vec4 uStrokeColor;
uniform float uStrokeInsetWidth;
uniform float uStrokeOutsetWidth;
uniform float thickness;
uniform float uDepthWrite;

varying vec2 atlasUV;

float median(vec3 msdf) {
    return max(min(msdf.r, msdf.g), min(max(msdf.r, msdf.g), msdf.b));
}
  
void main(void)
{
    vec3 s = texture2D(fontAtlas, atlasUV).rgb;
    float sigDist = median(s) - 0.5 + thickness;

    float alpha = clamp(sigDist / fwidth(sigDist) + 0.5, 0.0, 1.0);

    float sigDistOutset = sigDist + uStrokeOutsetWidth * 0.5;
    float sigDistInset = sigDist - uStrokeInsetWidth * 0.5;

    float outset = clamp(sigDistOutset / fwidth(sigDistOutset) + 0.5, 0.0, 1.0);
    float inset = 1.0 - clamp(sigDistInset / fwidth(sigDistInset) + 0.5, 0.0, 1.0);

    float border = outset * inset;

    // In depth-write mode, hard-cut the coverage (alpha test) so glyphs sort like solid geometry:
    // fully transparent pixels are discarded and the remaining pixels are made opaque, so no
    // semi-transparent edge pixels write depth (which would halo geometry drawn behind them).
    float fillCoverage = alpha;
    float strokeCoverage = border;
    if (uDepthWrite > 0.5) {
        if (max(alpha, border) < 0.5) {
            discard;
        }
        fillCoverage = step(0.5, alpha);
        strokeCoverage = step(0.5, border);
    }

    vec4 filledFragColor = vec4(uColor.rgb, fillCoverage * uColor.a);
    vec4 strokedFragColor = vec4(uStrokeColor.rgb, strokeCoverage * uStrokeColor.a);

    gl_FragColor = mix(filledFragColor, strokedFragColor, strokeCoverage);
}