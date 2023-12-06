precision highp float;

#include<helperFunctions>

varying vec3 vPositionW;
varying vec4 vColor;

#define CUSTOM_FRAGMENT_DEFINITIONS

void main(void) {
#define CUSTOM_FRAGMENT_MAIN_BEGIN

    float A = -dot(vPositionW.xy, vPositionW.xy);
    if (A < -4.0) discard;
    float B = exp(A) * vColor.a;
    vec4 color = vec4(vColor.rgb, B);

    gl_FragColor = color;

#define CUSTOM_FRAGMENT_MAIN_END
}
