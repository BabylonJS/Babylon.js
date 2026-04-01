/*  
{ 
    "smartFilterBlockType": "SepiaBlock", 
    "namespace": "Babylon.Demo.Effects", 
    "blockDisableStrategy": "AutoSample"
}
*/

uniform sampler2D input; // main
// { "default": 0.8 }
uniform float intensity;

vec4 sepia(vec2 vUV) { // main
    vec4 color = texture2D(input, vUV);

    float r = dot(color.rgb, vec3(0.393, 0.769, 0.189));
    float g = dot(color.rgb, vec3(0.349, 0.686, 0.168));
    float b = dot(color.rgb, vec3(0.272, 0.534, 0.131));

    vec3 sepiaColor = vec3(r, g, b);

    return vec4(mix(color.rgb, sepiaColor, intensity), color.a);
}
