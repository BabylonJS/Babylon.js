precision highp float;

// Sampler
uniform sampler2D shadowTexture;
uniform vec2 renderTargetSize;
uniform float shadowOpacity;
// Varying
varying vec2 vUV;

void main(void) {
    float uvBasedOpacity = clamp(length(vUV * vec2(2.0) - vec2(1.0)), 0.0, 1.0);
    uvBasedOpacity = uvBasedOpacity * uvBasedOpacity;
    uvBasedOpacity = 1.0 - uvBasedOpacity;

    vec2 screenUv = gl_FragCoord.xy / renderTargetSize;
    vec3 shadowValue = texture2D(shadowTexture, screenUv).rrr;

    float totalOpacity = shadowOpacity * uvBasedOpacity;
    vec3 invertedShadowValue = vec3(1.0) - shadowValue;

    gl_FragColor.rgb = shadowValue;
    gl_FragColor.a = invertedShadowValue.r * totalOpacity;
}