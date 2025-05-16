/* eslint-disable @typescript-eslint/naming-convention */
const name = "msdfFragmentShader";
const shader = `
#extension GL_OES_standard_derivatives : enable

precision highp float;

uniform sampler2D fontAtlas;
uniform vec2 unitRange;
uniform vec2 texelSize;
uniform vec4 uColor;
uniform float thickness;

varying vec2 atlasUV;

float median(vec3 msdf) {
    return max(min(msdf.r, msdf.g), min(max(msdf.r, msdf.g), msdf.b));
}
  
float screenPxRange(sampler2D tex) {
    vec2 screenTexSize = vec2(1.0) / fwidth(atlasUV);
    return max(0.5 * dot(unitRange, screenTexSize), 1.0);
}

void main(void)
{
    vec3 sdfCenter = texture2D(fontAtlas, atlasUV).rgb;
    vec3 sdfLeft = texture2D(fontAtlas, atlasUV - vec2(texelSize.x, 0.0)).rgb;
    vec3 sdfRight = texture2D(fontAtlas, atlasUV + vec2(texelSize.x, 0.0)).rgb;
    vec3 sdfTop = texture2D(fontAtlas, atlasUV - vec2(0.0, texelSize.y)).rgb;
    vec3 sdfBottom = texture2D(fontAtlas, atlasUV + vec2(0.0, texelSize.y)).rgb;

    vec3 sdf = (sdfCenter + sdfLeft + sdfRight + sdfTop + sdfBottom) / 5.0;

    float dist = median(sdfCenter);

    float pxRange = screenPxRange(fontAtlas);
    float pxDist = pxRange * (dist - 0.5 + thickness);
    float alpha = clamp(pxDist / fwidth(pxDist) + 0.5, 0.0, 1.0);

    gl_FragColor = vec4(uColor.rgb, alpha * uColor.a);
}`;

/** @internal */
export const msdfFragmentShader = { name, shader };
