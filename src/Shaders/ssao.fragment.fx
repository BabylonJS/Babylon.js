// SSAO Shader
precision highp float;
uniform sampler2D textureSampler;
uniform float near;
uniform float far;
uniform float radius;

varying vec2 vUV;

float perspectiveDepthToViewZ( const in float invClipZ, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * invClipZ - far );
}

float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( near * far / viewZ + far) / ( far - near );
}

float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}

#ifdef SSAO
uniform sampler2D randomSampler;
uniform sampler2D normalSampler;

uniform float randTextureTiles;
uniform float samplesFactor;
uniform vec3 sampleSphere[SAMPLES];

uniform float totalStrength;
uniform float base;
uniform float xViewport;
uniform float yViewport;

uniform mat4 projection;

void main()
{
	vec3 random = texture2D(randomSampler, vUV * randTextureTiles).rgb;
	float depth = texture2D(textureSampler, vUV).r;
	float linearDepth = - perspectiveDepthToViewZ(depth, near, far);
	vec3 normal = texture2D(normalSampler, vUV).rgb; 
	float occlusion = 0.0;

	vec3 vViewRay = vec3((vUV.x * 2.0 - 1.0)*xViewport, (vUV.y * 2.0 - 1.0)*yViewport, 1.0);
	vec3 origin = vViewRay * linearDepth;
	vec3 rvec = random * 2.0 - 1.0;
	rvec.z = 0.0;
	vec3 tangent = normalize(rvec - normal * dot(rvec, normal));
	vec3 bitangent = cross(normal, tangent);
	mat3 tbn = mat3(tangent, bitangent, normal);

	float difference;

	for (int i = 0; i < SAMPLES; ++i) {
		// get sample position:
	   vec3 samplePosition = tbn * sampleSphere[i];
	   samplePosition = samplePosition * radius + origin;
	  
		// project sample position:
	   vec4 offset = vec4(samplePosition, 1.0);
	   offset = projection * offset;
	   offset.xyz /= offset.w;
	   offset.xy = offset.xy * 0.5 + 0.5;
	  
		// get sample linearDepth:
	   float sampleDepth = texture(textureSampler, offset.xy).r;
	   float linearSampleDepth = - perspectiveDepthToViewZ(texture(textureSampler, offset.xy).r, near, far);
		// range check & accumulate:
	   float rangeCheck = abs(linearDepth - linearSampleDepth) < radius ? 1.0 : 0.0;
	  	difference = samplePosition.z - linearSampleDepth;
	  	//occlusion += step(fallOff, difference) * (1.0 - smoothstep(fallOff, area, difference)) * rangeCheck;
	  	occlusion += (difference > 0.0 ? 1.0 : 0.0) * rangeCheck;

	}


	// float screenEdgeFactor = clamp(vUV.x * 10.0, 0.0, 1.0) * clamp(vUV.y * 10.0, 0.0, 1.0) * clamp((1.0 - vUV.x) * 10.0, 0.0, 1.0) * clamp((1.0 - vUV.y) * 10.0, 0.0, 1.0);

	float ao = 1.0 - totalStrength * occlusion * samplesFactor;
	float result = clamp(ao + base, 0.0, 1.0);
	gl_FragColor = vec4(result, result, result, 1.0);
}
#endif

#ifdef BILATERAL_BLUR
uniform sampler2D depthSampler;
uniform float outSize;
uniform float samplerOffsets[SAMPLES];

void main()
{
	float texelsize = 1.0 / outSize;
	float compareDepth = texture2D(depthSampler, vUV).r;
	float linearDepth = - perspectiveDepthToViewZ(compareDepth, near, far);
	float result = 0.0;
	float weightSum = 0.0;

	for (int i = 0; i < SAMPLES; ++i)
	{
		#ifdef BILATERAL_BLUR_H
		vec2 sampleOffset = vec2(texelsize * samplerOffsets[i], 0.0);
		#else
		vec2 sampleOffset = vec2(0.0, texelsize * samplerOffsets[i]);
		#endif
		vec2 samplePos = vUV + sampleOffset;

		float sampleDepth = texture2D(depthSampler, samplePos).r;
		float linearSampleDepth = - perspectiveDepthToViewZ(sampleDepth, near, far);
		float weight = abs(linearDepth - linearSampleDepth) < radius ? 1.0 : 0.0;

		result += texture2D(textureSampler, samplePos).r * weight;
		weightSum += weight;
	}

	result /= weightSum;

	gl_FragColor.rgb = vec3(result);
	gl_FragColor.a = 1.0;
}
#endif
