#ifdef GL_ES
precision mediump float;
#endif

uniform vec3 vEyePosition;
uniform vec4 vLevels;
uniform vec3 waterColor;
uniform vec2 waveData;

// Lights
varying vec3 vPositionW;
varying vec3 vNormalW;
uniform vec3 vLightPosition;

// Refs
varying vec2 vBumpUV;
varying vec4 vUV;
uniform sampler2D refractionSampler;
uniform sampler2D reflectionSampler;
uniform sampler2D bumpSampler;

void main(void) {
	vec3 viewDirectionW = normalize(vEyePosition - vPositionW);

	// Light
	vec3 lightVectorW = normalize(vLightPosition - vPositionW);

	// Wave
	vec3 bumpNormal = 2.0 * texture2D(bumpSampler, vBumpUV).rgb - 1.0;
	vec2 perturbation = waveData.y * bumpNormal.rg;

	// diffuse
	float ndl = max(0., dot(vNormalW, lightVectorW));

	// Specular
	vec3 angleW = normalize(viewDirectionW + lightVectorW);
	float specComp = dot(normalize(vNormalW), angleW);
	specComp = pow(abs(specComp), 256.);

	// Refraction
	vec2 texCoords;
	texCoords.x = vUV.x / vUV.w / 2.0 + 0.5;
	texCoords.y = vUV.y / vUV.w / 2.0 + 0.5;

	vec3 refractionColor = texture2D(refractionSampler, texCoords + perturbation).rgb;

	// Reflection
	vec3 reflectionColor = texture2D(reflectionSampler, texCoords + perturbation).rgb;

	// Fresnel
	float fresnelTerm = dot(viewDirectionW, vNormalW);
	fresnelTerm = clamp((1.0 - fresnelTerm) * vLevels.y, 0., 1.);

	// Water color
	vec3 finalColor = (waterColor * ndl) * vLevels.x + (1.0 - vLevels.x) * (reflectionColor * fresnelTerm * vLevels.z + (1.0 - fresnelTerm) * refractionColor * vLevels.w) + specComp;

	
	gl_FragColor = vec4(finalColor, 1.);
}