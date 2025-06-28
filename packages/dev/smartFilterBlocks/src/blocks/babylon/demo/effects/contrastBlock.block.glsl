/*  
{ 
    "smartFilterBlockType": "ContrastBlock", 
    "namespace": "Babylon.Demo.Effects", 
    "blockDisableStrategy": "AutoSample"
}
*/

uniform sampler2D input; // main
// { "default": 0.5 }
uniform float intensity;

vec4 contrast(vec2 vUV) { // main
    vec4 color = texture2D(input, vUV);

    float contrastLMin = mix(-2., 0., intensity * 2.0);
    float contrastLMax = mix(3., 1., intensity * 2.0);

    vec3 contrastMin = remap(color.rgb, contrastLMin, contrastLMax, 0., 1.);

    float intensityMapped = remap(intensity, 0.5, 1., 0., 1.0);
    float contrastHMin = mix(0., 0.45, intensityMapped);
    float contrastHMax = mix(1., 0.5, intensityMapped);

    vec3 contrastMax = remap(color.rgb, contrastHMin, contrastHMax, 0., 1.);

    return vec4(mix(contrastMin, contrastMax, step(intensity, 0.5)), color.a);
}

float remap(float i, float smin, float smax, float dmin, float dmax) {
    return dmin + (i - smin) * (dmax - dmin) / (smax - smin);
}

vec3 remap(vec3 i, float smin, float smax, float dmin, float dmax) {
    return dmin + (i - smin) * (dmax - dmin) / (smax - smin);
}
