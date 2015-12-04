precision highp float;

// Samplers
varying vec2 vUV;
uniform sampler2D textureSampler;

uniform mat4 kernelMatrix;

void main(void)
{
	vec3 baseColor = texture2D(textureSampler, vUV).rgb;
	vec3 updatedColor = (kernelMatrix * vec4(baseColor, 1.0)).rgb;

	gl_FragColor = vec4(updatedColor, 1.0);
}