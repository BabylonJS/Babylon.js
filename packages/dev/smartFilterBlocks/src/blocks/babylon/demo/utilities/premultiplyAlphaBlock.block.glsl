/*  
{ 
    "smartFilterBlockType": "PremultiplyAlphaBlock", 
    "namespace": "Babylon.Demo.Utilities", 
    "blockDisableStrategy": "AutoSample"
}
*/

uniform sampler2D input; // main

vec4 premultiply(vec2 vUV) { // main
    vec4 color = texture2D(input, vUV);
    return vec4(color.rgb * color.a, color.a);
}