// SSAO Shader
uniform sampler2D textureSampler;

varying vec2 vUV;

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

float perspectiveDepthToViewZ( const in float invClipZ, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * invClipZ - far );
}

float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}

void main()
{
	vec3 random = normalize(texture2D(randomSampler, vUV * randTextureTiles).rgb);
	float depth = texture2D(textureSampler, vUV).r;
	float n = 0.1;                                // the near plane
	float f = 10.0;
	depth = perspectiveDepthToViewZ(depth, n, f);
	depth = viewZToOrthographicDepth(depth, n, f);
	// depth = (2.0 * n * f) / (f + n - (2.0 * depth - 1.0) * (f - n));  // convert to linear values 
	vec3 position = vec3(vUV, depth);
	vec3 normal = texture2D(normalSampler, vUV).rgb;//normalFromDepth(depth, vUV); 
	float radiusDepth = radius / depth;
	float occlusion = 0.0;

	vec3 ray;
	vec3 hemiRay;
	float occlusionDepth;
	float difference;

	for (int i = 0; i < SAMPLES; i++)
	{
		ray = clamp(radiusDepth * reflect(sampleSphere[i], random), vec3(-0.002, -0.002, -1000), vec3(0.002, 0.002, 1000));
		hemiRay = position + sign(dot(ray, normal)) * ray;

		occlusionDepth = texture2D(textureSampler, clamp(hemiRay.xy, vec2(0.001, 0.001), vec2(0.999, 0.999) )).r;
		difference = depth - occlusionDepth;

		occlusion += step(fallOff, difference) * (1.0 - smoothstep(fallOff, area, difference));
	}

	float ao = 1.0 - totalStrength * occlusion * samplesFactor;
	float result = clamp(ao + base, 0.0, 1.0);

	// gl_FragColor.r = result;
	// gl_FragColor.g = result;
	// gl_FragColor.b = result;
	// gl_FragColor.a = 1.0;
	// gl_FragColor = vec4(depth, depth, depth, 1.0);
	gl_FragColor = texture2D(textureSampler, vUV);
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
		float weight = (1.0 / (0.0001 + abs(compareDepth - sampleDepth)));

		result += texture2D(textureSampler, samplePos).r * weight;
		weightSum += weight;
	}

	result /= weightSum;

	gl_FragColor.rgb = vec3(result);
	gl_FragColor.a = 1.0;
}
#endif
