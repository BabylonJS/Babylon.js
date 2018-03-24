#include<helperFunctions>

// samplers
uniform sampler2D textureSampler;	// original color

// uniforms
uniform float intensity;
uniform float animatedSeed;

// varyings
varying vec2 vUV;

void main(void)
{
    gl_FragColor = texture2D(textureSampler, vUV);
	vec2 seed = vUV*(animatedSeed);
    float grain = dither(seed, intensity);

    // Add less grain when luminance is high or low
    float lum = getLuminance(gl_FragColor.rgb);
    float grainAmount = (cos(-PI + (lum*PI*2.))+1.)/2.;
    gl_FragColor.rgb += grain * grainAmount;

    gl_FragColor.rgb = max(gl_FragColor.rgb, 0.0);
}