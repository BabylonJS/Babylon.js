// From Blender sources: https://developer.blender.org/D3617#change-jG1fqR1RpokL
// Forum request: https://forum.babylonjs.com/t/cavity-shader-effect-like-blender-2-8-viewport-for-babylon-js/11789
precision highp float;

// Samplers
varying vec2 vUV;
uniform sampler2D textureSampler;
uniform sampler2D normalSampler;

uniform float curvature_ridge;
uniform float curvature_valley;

#ifndef CURVATURE_OFFSET
    #define CURVATURE_OFFSET 1
#endif

float curvature_soft_clamp(float curvature, float control)
{
    if (curvature < 0.5 / control)
        return curvature * (1.0 - curvature * control);
    return 0.25 / control;
}

float calculate_curvature(ivec2 texel, float ridge, float valley)
{
    vec2 normal_up    = texelFetchOffset(normalSampler, texel, 0, ivec2(0,  CURVATURE_OFFSET)).rb;
    vec2 normal_down  = texelFetchOffset(normalSampler, texel, 0, ivec2(0, -CURVATURE_OFFSET)).rb;
    vec2 normal_left  = texelFetchOffset(normalSampler, texel, 0, ivec2(-CURVATURE_OFFSET, 0)).rb;
    vec2 normal_right = texelFetchOffset(normalSampler, texel, 0, ivec2( CURVATURE_OFFSET, 0)).rb;

    float normal_diff = ((normal_up.g - normal_down.g) + (normal_right.r - normal_left.r));

    if (normal_diff < 0.0)
        return -2.0 * curvature_soft_clamp(-normal_diff, valley);

    return 2.0 * curvature_soft_clamp(normal_diff, ridge);
}

void main(void) 
{
    ivec2 texel = ivec2(gl_FragCoord.xy);

    vec4 baseColor = texture2D(textureSampler, vUV);

    float curvature = calculate_curvature(texel, curvature_ridge, curvature_valley);
    baseColor.rgb *= curvature + 1.0;

    gl_FragColor = baseColor;
}