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

    // fwidth() is 0 where the distance field is flat (beyond the atlas distance range), and dividing by 0 is undefined.
    float alpha = clamp(sigDist / max(fwidth(sigDist), 1e-5) + 0.5, 0.0, 1.0);

    float sigDistOutset = sigDist + uStrokeOutsetWidth * 0.5;
    float sigDistInset = sigDist - uStrokeInsetWidth * 0.5;

    float outset = clamp(sigDistOutset / max(fwidth(sigDistOutset), 1e-5) + 0.5, 0.0, 1.0);
    float inset = 1.0 - clamp(sigDistInset / max(fwidth(sigDistInset), 1e-5) + 0.5, 0.0, 1.0);

    float border = outset * inset;

    // When writing to the depth buffer, discard only the fully-transparent background of the glyph
    // quads (so they don't occlude other geometry). Visible pixels keep their anti-aliased coverage.
    if (uDepthWrite > 0.5 && max(alpha, border) <= 0.0) {
        discard;
    }

    vec4 filledFragColor = vec4(uColor.rgb, alpha * uColor.a);
    vec4 strokedFragColor = vec4(uStrokeColor.rgb, border * uStrokeColor.a);

    gl_FragColor = mix(filledFragColor, strokedFragColor, border);
}