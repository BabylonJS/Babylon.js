#ifdef GL_ES
precision mediump float;
#endif

// Lights
varying vec3 vPositionW;
varying vec3 vNormalW;
varying vec2 vUV;


// Refs
uniform float ToonThresholds[4];
uniform float ToonBrightnessLevels[5];
uniform vec3 vLightPosition;
uniform vec3 vLightColor;

uniform sampler2D textureSampler;

void main(void) {
	// Light
	vec3 lightVectorW = normalize(vLightPosition - vPositionW);

	// diffuse
	float ndl = max(0., dot(vNormalW, lightVectorW));

	vec3 color = texture2D(textureSampler, vUV).rgb * vLightColor;

	if (ndl > ToonThresholds[0])
	{
		color *= ToonBrightnessLevels[0];
	} 
	else if (ndl > ToonThresholds[1])
	{
		color *= ToonBrightnessLevels[1];
	}
	else if (ndl > ToonThresholds[2])
	{
		color *= ToonBrightnessLevels[2];
	}
	else if (ndl > ToonThresholds[3])
	{
		color *= ToonBrightnessLevels[3];
	}
	else
	{
		color *= ToonBrightnessLevels[4];
	}
	
	gl_FragColor = vec4(color, 1.);
}