uniform bool alphaTest;

varying vec4 vColor;

// Samplers
varying vec2 vUV;
uniform sampler2D diffuseSampler;

// Fog
#include<fogFragmentDeclaration>

void main(void) {
	vec4 color = texture2D(diffuseSampler, vUV);

	if (alphaTest) 
	{
		if (color.a < 0.95)
			discard;
	}

	color *= vColor;

#include<fogFragment>

#ifdef PREPASS
    float writeGeometryInfo = color.a > 0.4 ? 1.0 : 0.0;
    #ifdef PREPASS_VELOCITY
    gl_FragData[PREPASS_VELOCITY_INDEX] = vec4(0.5, 0.5, 0.0, writeGeometryInfo);
    #endif
    gl_FragData[0] = color;
#endif

#if !defined(PREPASS) || defined(WEBGL2) 
	gl_FragColor = color;
#endif

#include<imageProcessingCompatibility>
}