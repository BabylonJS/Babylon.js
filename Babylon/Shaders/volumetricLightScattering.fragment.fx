// Inspired by http://http.developer.nvidia.com/GPUGems3/gpugems3_ch13.html

#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D textureSampler;
uniform sampler2D lightScatteringSampler;

uniform vec2 lightPositionOnScreen;

varying vec2 vUV;

void main(void) {
	
    float decay = 0.96815;
    float exposure = 0.3;
    float density = 0.926;
    float weight = 0.58767;

    const int NUM_SAMPLES = 100;

    vec2 tc = vUV;
    vec2 deltaTexCoord = (tc - lightPositionOnScreen.xy);
    deltaTexCoord *= 1.0 / float(NUM_SAMPLES) * density;

    float illuminationDecay = 1.0;

	vec4 color = texture2D(lightScatteringSampler, tc) * 0.4;

    for(int i=0; i < NUM_SAMPLES; i++)
    {
        tc -= deltaTexCoord;
		vec4 sample = texture2D(lightScatteringSampler, tc) * 0.4;
        sample *= illuminationDecay * weight;
        color += sample;
        illuminationDecay *= decay;
    }

    vec4 realColor = texture2D(textureSampler, vUV);
    gl_FragColor = ((vec4((vec3(color.r, color.g, color.b) * exposure), 1)) + (realColor * (1.5 - 0.4)));
}
