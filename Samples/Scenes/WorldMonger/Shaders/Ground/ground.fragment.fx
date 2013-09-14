#ifdef GL_ES
precision mediump float;
#endif

uniform vec3 vEyePosition;
uniform vec3 vLimits;
uniform vec3 vLightPosition;

// UVs
varying vec4 vGroundSnowUV;
varying vec4 vGrassBlendUV;
varying vec4 vRockSandUV;

// Ground
uniform sampler2D groundSampler;

// Sand
uniform sampler2D sandSampler;

// Rock
uniform sampler2D rockSampler;

// Snow
uniform sampler2D snowSampler;

// Snow
uniform sampler2D grassSampler;

// Snow
uniform sampler2D blendSampler;

// Lights
varying vec3 vPositionW;
varying vec3 vNormalW;

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

	//// Specular
	//vec3 angleW = normalize(viewDirectionW + lightVectorW);
	//float specComp = dot(normalize(vNormalW), angleW);
	//specComp = pow(specComp, 256.) * 0.8;

	// Final composition
	vec3 finalColor = vec3(0., 0., 0.);
	vec2 uvOffset = vec2(1.0 / 512.0, 1.0 / 512.0);

	if (vPositionW.y <= vLimits.x) 
	{
		float lowLimit = vLimits.x - 2.;
		float gradient = clamp((vPositionW.y - lowLimit) / (vLimits.x - lowLimit), 0., 1.);

		float blend = texture2D(blendSampler, vGrassBlendUV.zw).r;
		vec3 groundColor = texture2D(groundSampler, vGroundSnowUV.xy).rgb * (1.0 - blend) + blend * texture2D(grassSampler, vGrassBlendUV.xy).rgb;

		finalColor = ndl * (texture2D(sandSampler, vRockSandUV.zw).rgb * (1.0 - gradient) + gradient * groundColor);
	}
	else if (vPositionW.y > vLimits.x && vPositionW.y <= vLimits.y)
	{
		float lowLimit = vLimits.y - 2.;
		float gradient = clamp((vPositionW.y - lowLimit) / (vLimits.y - lowLimit), 0., 1.);

		float blend = texture2D(blendSampler, vGrassBlendUV.zw).r;
		vec3 currentColor = texture2D(groundSampler, vGroundSnowUV.xy).rgb * (1.0 - blend) + blend  * texture2D(grassSampler, vGrassBlendUV.xy).rgb;

		finalColor = ndl * (currentColor * (1.0 - gradient) + gradient * texture2D(rockSampler, vRockSandUV.xy + uvOffset).rgb);
	}
	else if (vPositionW.y > vLimits.y && vPositionW.y <= vLimits.z)
	{
		float lowLimit = vLimits.z - 1.;
		float gradient = clamp((vPositionW.y - lowLimit) / (vLimits.z - lowLimit), 0., 1.);

		finalColor = ndl * (texture2D(rockSampler, vRockSandUV.xy + uvOffset).rgb * (1.0 - gradient)) + gradient *(ndl * texture2D(snowSampler, vGroundSnowUV.zw).rgb);
	}
	else
	{
		finalColor = texture2D(snowSampler, vGroundSnowUV.zw).rgb * ndl;
	}

	gl_FragColor = vec4(finalColor, 1.);
}