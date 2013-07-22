#ifdef GL_ES
precision mediump float;
#endif

uniform vec3 vEyePosition;
uniform vec3 vLimits;

// Ground
varying vec2 vGroundUV;
uniform sampler2D groundSampler;

// Sand
varying vec2 vSandUV;
uniform sampler2D sandSampler;

// Rock
varying vec2 vRockUV;
uniform sampler2D rockSampler;

// Snow
varying vec2 vSnowUV;
uniform sampler2D snowSampler;

// Snow
varying vec2 vGrassUV;
uniform sampler2D grassSampler;

// Snow
varying vec2 vBlendUV;
uniform sampler2D blendSampler;

// Lights
varying vec3 vPositionW;
varying vec3 vNormalW;
uniform vec3 vLightPosition;

#ifdef CLIPPLANE
varying float fClipDistance;
#endif

void main(void) {
	// Clip plane
#ifdef CLIPPLANE
	if (fClipDistance > 0.0)
		discard;
#endif

	vec3 viewDirectionW = normalize(vEyePosition - vPositionW);

	// Light
	vec3 lightVectorW = normalize(vLightPosition - vPositionW);

	// diffuse
	float ndl = max(0., dot(vNormalW, lightVectorW));

	// Final composition
	vec3 finalColor = vec3(0., 0., 0.);
	vec2 uvOffset = vec2(1.0 / 512.0, 1.0 / 512.0);

	if (vPositionW.y <= vLimits.x) 
	{
		float lowLimit = vLimits.x - 2.;
		float gradient = clamp((vPositionW.y - lowLimit) / (vLimits.x - lowLimit), 0., 1.);

		float blend = texture2D(blendSampler, vBlendUV).r;
		vec3 groundColor = texture2D(groundSampler, vGroundUV).rgb * (1.0 - blend) + blend * texture2D(grassSampler, vGrassUV).rgb;

		finalColor = ndl * (texture2D(sandSampler, vSandUV).rgb * (1.0 - gradient) + gradient * groundColor);
	}
	else if (vPositionW.y > vLimits.x && vPositionW.y <= vLimits.y)
	{
		float lowLimit = vLimits.y - 2.;
		float gradient = clamp((vPositionW.y - lowLimit) / (vLimits.y - lowLimit), 0., 1.);

		float blend = texture2D(blendSampler, vBlendUV).r;
		vec3 currentColor = texture2D(groundSampler, vGroundUV).rgb * (1.0 - blend) + blend  * texture2D(grassSampler, vGrassUV).rgb;

		finalColor = ndl * (currentColor * (1.0 - gradient) + gradient * texture2D(rockSampler, vRockUV + uvOffset).rgb);
	}
	else if (vPositionW.y > vLimits.y && vPositionW.y <= vLimits.z)
	{
		float lowLimit = vLimits.z - 1.;
		float gradient = clamp((vPositionW.y - lowLimit) / (vLimits.z - lowLimit), 0., 1.);

		// Specular
		vec3 angleW = normalize(viewDirectionW + lightVectorW);
		float specComp = dot(normalize(vNormalW), angleW);
		specComp = pow(specComp, 256.);

		finalColor = ndl * (texture2D(rockSampler, vRockUV + uvOffset).rgb * (1.0 - gradient)) + gradient *(ndl * texture2D(snowSampler, vSnowUV).rgb + specComp);
	}
	else
	{
		// Specular
		vec3 angleW = normalize(viewDirectionW + lightVectorW);
		float specComp = dot(normalize(vNormalW), angleW);
		specComp = pow(specComp, 256.) * 0.8;

		finalColor = texture2D(snowSampler, vSnowUV).rgb * ndl + specComp;
	}

	gl_FragColor = vec4(finalColor, 1.);
}