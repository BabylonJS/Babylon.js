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

    #ifdef SSR_INPUT_IS_GAMMA_SPACE
        color = toLinearSpace(color);
    #endif

    vec3 reflectionMultiplier = clamp(pow(reflectivity.rgb * strength, vec3(reflectionSpecularFalloffExponent)), 0.0, 1.0);
    vec3 colorMultiplier = 1.0 - reflectionMultiplier;

    vec3 finalColor = (color.rgb * colorMultiplier) + (SSR * reflectionMultiplier);
    #ifdef SSR_OUTPUT_IS_GAMMA_SPACE
        finalColor = toGammaSpace(finalColor);
    #endif

    gl_FragColor = vec4(finalColor, color.a);
#endif
}
