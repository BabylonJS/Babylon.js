#extension GL_OES_standard_derivatives : enable

precision highp float;

uniform sampler2D fontAtlas;
uniform vec4 uColor;
uniform vec4 uStrokeColor;
uniform float uStrokeInsetWidth;
uniform float uStrokeOutsetWidth;
uniform float thickness;

varying vec2 atlasUV;

float median(vec3 msdf) {
    return max(min(msdf.r, msdf.g), min(max(msdf.r, msdf.g), msdf.b));
}
  
void main(void)
{
    vec3 s = texture2D(fontAtlas, atlasUV).rgb;
    float sigDist = median(s) - 0.5 + thickness;

    // Floor fwidth to avoid NaN/Inf when sigDist is constant across a derivative quad
    // (happens at high atlas->screen upsample where neighboring fragments hit the same texel).
    float w = max(fwidth(sigDist), 0.0001);
    float alpha = clamp(sigDist / w + 0.5, 0.0, 1.0);

    float sigDistOutset = sigDist + uStrokeOutsetWidth * 0.5;
    float sigDistInset = sigDist - uStrokeInsetWidth * 0.5;

    float wOutset = max(fwidth(sigDistOutset), 0.0001);
    float wInset = max(fwidth(sigDistInset), 0.0001);

    float outset = clamp(sigDistOutset / wOutset + 0.5, 0.0, 1.0);
    float inset = 1.0 - clamp(sigDistInset / wInset + 0.5, 0.0, 1.0);

    float border = outset * inset;

    vec4 filledFragColor = vec4(uColor.rgb, alpha * uColor.a);
    vec4 strokedFragColor = vec4(uStrokeColor.rgb, border * uStrokeColor.a);

    gl_FragColor = mix(filledFragColor, strokedFragColor, border);
}