// SSAO Shader
precision highp float;
uniform sampler2D textureSampler;

varying vec2 vUV;

float perspectiveDepthToViewZ( const in float invClipZ, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * invClipZ - far );
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
uniform float radius;
uniform float area;
uniform float fallOff;
uniform float base;
uniform float xViewport;
uniform float yViewport;

uniform mat4 projection;

vec3 normalFromDepth(float depth, vec2 coords)
{	
	vec2 offset1 = vec2(0.0, radius);
	vec2 offset2 = vec2(radius, 0.0);

	float depth1 = texture2D(textureSampler, coords + offset1).r;
	float depth2 = texture2D(textureSampler, coords + offset2).r;

	vec3 p1 = vec3(offset1, depth1 - depth);
	vec3 p2 = vec3(offset2, depth2 - depth);

	vec3 normal = cross(p1, p2);
	normal.z = -normal.z;

	return normalize(normal);
}

void main()
{
	vec3 random = normalize(texture2D(randomSampler, vUV * randTextureTiles).rgb);
	float depth = texture2D(textureSampler, vUV).r;
	float n = 1.0;                                // the near plane
	float f = 100.0;
	float linearDepth = - perspectiveDepthToViewZ(depth, n, f);
	vec3 position = vec3(vUV, linearDepth);
	vec3 normal = texture2D(normalSampler, vUV).rgb; 
	float radiusDepth = radius; //linearDepth / radius;
	float occlusion = 0.0;

	vec3 vViewRay = vec3((vUV.x * 2.0 - 1.0)*xViewport, (vUV.y * 2.0 - 1.0)*yViewport, 1.0);
	vec3 origin = vViewRay * linearDepth;
	vec3 rvec = random * 2.0 - 1.0;
	vec3 tangent = normalize(rvec - normal * dot(rvec, normal));
	vec3 bitangent = cross(normal, tangent);
	mat3 tbn = mat3(tangent, bitangent, normal);

	vec3 ray;
	vec3 hemiRay;
	float occlusionDepth;
	float difference;

	// for (int i = 0; i < SAMPLES; i++)
	// {
	// 	ray = 0.02 * reflect(sampleSphere[i], random);
	// 	hemiRay = position + sign(dot(ray, normal)) * ray;

	// 	occlusionDepth = texture2D(textureSampler, clamp(hemiRay.xy, vec2(0.001, 0.001), vec2(0.999, 0.999))).r;
	// 	difference = linearDepth - occlusionDepth;

	// 	occlusion += step(fallOff, difference) * (1.0 - smoothstep(fallOff, area, difference));
	// }

	for (int i = 0; i < SAMPLES; ++i) {
		// get sample position:
	   vec3 samplePosition = tbn * sampleSphere[i];
	   samplePosition = samplePosition * radiusDepth + origin;
	  
		// project sample position:
		// vec2 offset = vec2(n / samplePosition.z * samplePosition.x,  n / samplePosition.z * samplePosition.y) * 0.5 + 0.5;
	   vec4 offset = vec4(samplePosition, 1.0);
	   offset = projection * offset;
	   offset.xyz /= offset.w;
	   offset.xy = offset.xy * 0.5 + 0.5;
	  
		// get sample linearDepth:
	   float sampleDepth = texture(textureSampler, offset.xy).r;
	   float linearSampleDepth = - perspectiveDepthToViewZ(texture(textureSampler, offset.xy).r, n, f);
		// range check & accumulate:
	   float rangeCheck = abs(linearDepth - linearSampleDepth) < radiusDepth ? 1.0 : 0.0;
	   // occlusion += (sampleDepth <= samplePosition.z ? 1.0 : 0.0) * rangeCheck;
	  	difference = samplePosition.z - linearSampleDepth;
	  	//occlusion += step(fallOff, difference) * (1.0 - smoothstep(fallOff, area, difference)) * rangeCheck;
	  	occlusion += (difference > 0.00000005 ? 1.0 : 0.0) * rangeCheck;

	}


	float ao = 1.0 - totalStrength * occlusion * samplesFactor;
	float result = clamp(ao + base, 0.0, 1.0);

	// gl_FragColor.r = result;
	// gl_FragColor.g = result;
	// gl_FragColor.b = result;
	// gl_FragColor.a = 1.0;
	ao = 1.0 - totalStrength * occlusion * samplesFactor;
	gl_FragColor = vec4(ao, ao, ao, 1.0);
}
#endif

#ifdef BILATERAL_BLUR
uniform sampler2D depthSampler;
uniform float outSize;
uniform float samplerOffsets[SAMPLES];

void main()
{

	// TODO change
	float n = 1.0;
	float f = 100.0;
	float texelsize = 1.0 / outSize;
	float compareDepth = texture2D(depthSampler, vUV).r;
	float linearDepth = - perspectiveDepthToViewZ(compareDepth, n, f);
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
		float linearSampleDepth = - perspectiveDepthToViewZ(sampleDepth, n, f);
		float weight = (1.0 / (0.0005 + abs(linearDepth - linearSampleDepth)));

		result += texture2D(textureSampler, samplePos).r * weight;
		weightSum += weight;
	}

	result /= weightSum;

	gl_FragColor.rgb = vec3(result);
	gl_FragColor.a = 1.0;
}
#endif
