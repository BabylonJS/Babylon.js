/*  
{ 
    "smartFilterBlockType": "DesaturateBlock", 
    "namespace": "Babylon.Demo.Effects", 
    "blockDisableStrategy": "AutoSample"
}
*/

uniform sampler2D input; // main
// { "default": 0.3 }
uniform float intensity;

vec4 desaturate(vec2 vUV) { // main
    float saturationStrength = 1. - intensity;

    vec4 color = texture2D(input, vUV);

    float tempMin = min(min(color.x, color.y), color.z);
    float tempMax = max(max(color.x, color.y), color.z);
    float tempMerge = 0.5 * (tempMin + tempMax);

    return vec4(mix(color.rgb, vec3(tempMerge, tempMerge, tempMerge), saturationStrength), color.a);
}
            