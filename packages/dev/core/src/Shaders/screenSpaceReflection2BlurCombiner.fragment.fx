uniform sampler2D textureSampler; // blur
uniform sampler2D mainSampler;
uniform sampler2D reflectivitySampler;

uniform float strength;
uniform float reflectionSpecularFalloffExponent;
uniform float reflectivityThreshold;

varying vec2 vUV;

#include<helperFunctions>

void main()
{
#ifdef SSRAYTRACE_DEBUG
    gl_FragColor = texture2D(textureSampler, vUV);
#else
    vec3 SSR = texture2D(textureSampler, vUV).rgb;
    vec4 color = texture2D(mainSampler, vUV);
    vec4 reflectivity = texture2D(reflectivitySampler, vUV);

    if (max(reflectivity.r, max(reflectivity.g, reflectivity.b)) <= reflectivityThreshold) {
        gl_FragColor = color;
        return;
    }

    color = toLinearSpace(color);

    vec3 reflectionMultiplier = clamp(pow(reflectivity.rgb * strength, vec3(reflectionSpecularFalloffExponent)), 0.0, 1.0);
    vec3 colorMultiplier = 1.0 - reflectionMultiplier;

    gl_FragColor = vec4(toGammaSpace((color.rgb * colorMultiplier) + (SSR * reflectionMultiplier)), color.a);
#endif
}
