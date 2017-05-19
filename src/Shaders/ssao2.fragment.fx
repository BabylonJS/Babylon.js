// SSAO 2 Shader
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
uniform float maxZ;
uniform float minZAspect;
uniform vec2 texelSize;

uniform mat4 projection;

void main()
{
	vec3 random = texture2D(randomSampler, vUV * randTextureTiles).rgb;
	float depth = texture(textureSampler, vUV).r;
	float linearDepth = - perspectiveDepthToViewZ(depth, near, far);
	vec3 normal = texture2D(normalSampler, vUV).rgb; 
	float occlusion = 0.0;
	float correctedRadius = min(radius, minZAspect * linearDepth / near);

	vec3 vViewRay = vec3((vUV.x * 2.0 - 1.0)*xViewport, (vUV.y * 2.0 - 1.0)*yViewport, 1.0);
	vec3 origin = vViewRay * linearDepth;
	vec3 rvec = random * 2.0 - 1.0;
	rvec.z = 0.0;
	vec3 tangent = normalize(rvec - normal * dot(rvec, normal));
	vec3 bitangent = cross(normal, tangent);
	mat3 tbn = mat3(tangent, bitangent, normal);

	float difference;

	if (linearDepth > maxZ) {
		gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
		return;
	}

	for (int i = 0; i < SAMPLES; ++i) {
		// get sample position:
	   vec3 samplePosition = tbn * sampleSphere[i];
	   samplePosition = samplePosition * correctedRadius + origin;
	  
		// project sample position:
	   vec4 offset = vec4(samplePosition, 1.0);
	   offset = projection * offset;
	   offset.xyz /= offset.w;
	   offset.xy = offset.xy * 0.5 + 0.5;
	  
		// get sample linearDepth:
	   float sampleDepth = texture(textureSampler, offset.xy).r;
	   float linearSampleDepth = - perspectiveDepthToViewZ(sampleDepth, near, far);
		// range check & accumulate:
	   float rangeCheck = abs(linearDepth - linearSampleDepth) < correctedRadius ? 1.0 : 0.0;
	   difference = samplePosition.z - linearSampleDepth;
	   float errorFactor = max(0.0, pow((maxZ-linearDepth) / maxZ, 0.25));
	  //occlusion += step(fallOff, difference) * (1.0 - smoothstep(fallOff, area, difference)) * rangeCheck * errorFactor;
	   occlusion += (difference >= 1e-5 ? 1.0 : 0.0) * rangeCheck * errorFactor;
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

vec4 blur9(sampler2D image, vec2 uv, float resolution, vec2 direction) {
  vec4 color = vec4(0.0);
  vec2 off1 = vec2(1.3846153846) * direction;
  vec2 off2 = vec2(3.2307692308) * direction;
  color += texture2D(image, uv) * 0.2270270270;
  color += texture2D(image, uv + (off1 / resolution)) * 0.3162162162;
  color += texture2D(image, uv - (off1 / resolution)) * 0.3162162162;
  color += texture2D(image, uv + (off2 / resolution)) * 0.0702702703;
  color += texture2D(image, uv - (off2 / resolution)) * 0.0702702703;
  return color;
}

vec4 blur13(sampler2D image, vec2 uv, float resolution, vec2 direction) {
  vec4 color = vec4(0.0);
  vec2 off1 = vec2(1.411764705882353) * direction;
  vec2 off2 = vec2(3.2941176470588234) * direction;
  vec2 off3 = vec2(5.176470588235294) * direction;
  color += texture2D(image, uv) * 0.1964825501511404;
  color += texture2D(image, uv + (off1 / resolution)) * 0.2969069646728344;
  color += texture2D(image, uv - (off1 / resolution)) * 0.2969069646728344;
  color += texture2D(image, uv + (off2 / resolution)) * 0.09447039785044732;
  color += texture2D(image, uv - (off2 / resolution)) * 0.09447039785044732;
  color += texture2D(image, uv + (off3 / resolution)) * 0.010381362401148057;
  color += texture2D(image, uv - (off3 / resolution)) * 0.010381362401148057;
  return color;
}

vec4 linearUpsample(sampler2D image, vec2 uv, float resolution, vec2 direction) {
	float texel = dot(uv, direction) * resolution;
	float before = float(floor(texel));
	float weight = texel - before;
	vec4 color = mix(texture2D(image, uv - vec2(weight / resolution) * direction), texture2D(image, uv + vec2((1.0 - weight) / resolution) * direction), weight);

	return color;
}

void main()
{
	#if EXPENSIVE
	float compareDepth = texture2D(depthSampler, vUV).r;
	float linearDepth = - perspectiveDepthToViewZ(compareDepth, near, far);
	float texelsize = 1.0 / outSize;
	float result = 0.0;
	float weightSum = 0.0;

	for (int i = 0; i < SAMPLES; ++i)
	{
		#ifdef BILATERAL_BLUR_H
		vec2 direction = vec2(1.0, 0.0);
		vec2 sampleOffset = vec2(texelsize * samplerOffsets[i], 0.0);
		#else
		vec2 direction = vec2(0.0, 1.0);
		vec2 sampleOffset = vec2(0.0, texelsize * samplerOffsets[i]);
		#endif
		vec2 samplePos = vUV + sampleOffset;

		float sampleDepth = texture2D(depthSampler, samplePos).r;
		float linearSampleDepth = - perspectiveDepthToViewZ(sampleDepth, near, far);
		float weight = clamp(1.0 / ( 0.003 + abs(linearDepth - linearSampleDepth)), 0.0, 30.0);

		result += texture2D(textureSampler, samplePos).r * weight;
		weightSum += weight;
	}

	result /= weightSum;
	gl_FragColor.rgb = vec3(result);
	gl_FragColor.a = 1.0;
	#else
	vec4 color;
	#ifdef BILATERAL_BLUR_H
	vec2 direction = vec2(1.0, 0.0);
	color = blur13(textureSampler, vUV, outSize, direction);
	#else
	vec2 direction = vec2(0.0, 1.0);
	color = blur13(textureSampler, vUV, outSize, direction);
	#endif

	gl_FragColor.rgb = vec3(color.r);
	gl_FragColor.a = 1.0;
	#endif
}
#endif
