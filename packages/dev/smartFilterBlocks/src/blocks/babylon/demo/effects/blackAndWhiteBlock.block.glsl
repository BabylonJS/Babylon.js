/*
{
    "smartFilterBlockType": "BlackAndWhiteBlock", 
    "namespace": "Babylon.Demo.Effects",
    "blockDisableStrategy": "AutoSample"
}
*/

uniform sampler2D input; // main

vec4 blackAndWhite(vec2 vUV) { // main
    vec4 color = texture2D(input, vUV);

    float luminance = dot(color.rgb, vec3(0.3, 0.59, 0.11));
    vec3 bg = vec3(luminance, luminance, luminance);

    return vec4(bg, color.a);
}
