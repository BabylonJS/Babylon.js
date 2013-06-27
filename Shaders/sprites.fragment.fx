#ifdef GL_ES
precision mediump float;
#endif

uniform bool alphaTest;

// Samplers
varying vec2 vUV;
uniform sampler2D diffuseSampler;


void main(void) {
	vec4 baseColor = texture2D(diffuseSampler, vUV);

	if (alphaTest) 
	{
		if (baseColor.a < 0.95)
			discard;
	}

	gl_FragColor = baseColor;
}