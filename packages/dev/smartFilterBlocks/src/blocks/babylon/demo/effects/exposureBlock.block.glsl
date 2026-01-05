/*  
{ 
    "smartFilterBlockType": "ExposureBlock", 
    "namespace": "Babylon.Demo.Effects", 
    "blockDisableStrategy": "AutoSample"
}
*/

uniform sampler2D input; // main
uniform float amount;

vec4 exposure(vec2 vUV) { // main
    vec4 color = texture2D(input, vUV);
    return vec4(color.rgb * amount, color.a);
}
