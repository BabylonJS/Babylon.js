/*  
{ 
    "smartFilterBlockType": "PosterizeBlock", 
    "namespace": "Babylon.Demo.Effects", 
    "blockDisableStrategy": "AutoSample"
}
*/

uniform sampler2D input; // main
// { "default": 0.3 }
uniform float intensity;

const float posterizePower = 6.0;
const float minLevel = 2.0;
const float maxLevel = 256.0;

vec4 posterize(vec2 vUV) { // main
    vec4 color = texture2D(input, vUV);

    float posterizeStrength = mix(minLevel, maxLevel, pow(1. - intensity, posterizePower));
    vec3 posterize = vec3(posterizeStrength);
    color.rgb = floor(color.rgb / (1.0 / posterize)) * (1.0 / posterize);

    return color;
}
