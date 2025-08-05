/*  
{ 
    "smartFilterBlockType": "MaskBlock", 
    "namespace": "Babylon.Demo.Effects", 
    "blockDisableStrategy": "AutoSample"
}
*/

uniform sampler2D input; // main
uniform sampler2D mask;

vec4 maskBlock(vec2 vUV) { // main
    vec4 color = texture2D(input, vUV);
    vec3 maskColor = texture2D(mask, vUV).rgb;
    float luminance = dot(maskColor, vec3(0.3, 0.59, 0.11));

    return vec4(color.rgb * luminance, luminance * color.a);
}
