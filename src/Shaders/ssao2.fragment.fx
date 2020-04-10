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

uniform vec2 randTextureTiles;
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
	float depth = texture2D(textureSampler, vUV).r;
	float depthSign = sign(depth);
	depth = depth * depthSign;
	vec3 normal = texture2D(normalSampler, vUV).rgb;
	float occlusion = 0.0;
	float correctedRadius = min(radius, minZAspect * depth / near);

	vec3 vViewRay = vec3((vUV.x * 2.0 - 1.0)*xViewport, (vUV.y * 2.0 - 1.0)*yViewport, depthSign);
  // flipping normals in case of polygons with no backface culling, to avoid generating fully occluded hemisphere
  normal = sign(-dot(normal, vViewRay)) * normal;
	vec3 origin = vViewRay * depth;
	vec3 rvec = random * 2.0 - 1.0;
	rvec.z = 0.0;

	// Avoid numerical precision issue while applying Gram-Schmidt
	float dotProduct = dot(rvec, normal);
	rvec = 1.0 - abs(dotProduct) > 1e-2 ? rvec : vec3(-rvec.y, 0.0, rvec.x);
	vec3 tangent = normalize(rvec - normal * dot(rvec, normal));
	vec3 bitangent = cross(normal, tangent);
	mat3 tbn = mat3(tangent, bitangent, normal);

	float difference;

	for (int i = 0; i < SAMPLES; ++i) {
		// get sample position
	   vec3 samplePosition = tbn * sampleSphere[(i + int(random.y * float(SAMPLES))) % SAMPLES];
	   samplePosition = samplePosition * correctedRadius + origin;
	  
		// project sample position:
	   vec4 offset = vec4(samplePosition, 1.0);
	   offset = projection * offset;
	   offset.xyz /= offset.w;
	   offset.xy = offset.xy * 0.5 + 0.5;

	   if (offset.x < 0.0 || offset.y < 0.0 || offset.x > 1.0 || offset.y > 1.0) {
	     continue;
	   }
	  
		// get sample linearDepth:
	   float sampleDepth = abs(texture2D(textureSampler, offset.xy).r);
		// range check & accumulate:
	   difference = depthSign * samplePosition.z - sampleDepth;
	   float rangeCheck = 1.0 - smoothstep(correctedRadius*0.5, correctedRadius, difference);
	   occlusion += (difference >= 0.0005 ? 1.0 : 0.0) * rangeCheck;
	}
	occlusion = occlusion*(1.0 - smoothstep(maxZ * 0.75, maxZ, depth));
	float ao = 1.0 - totalStrength * occlusion * samplesFactor;
	float result = clamp(ao + base, 0.0, 1.0);
	gl_FragColor = vec4(vec3(result), 1.0);
}
#endif

#ifdef BILATERAL_BLUR
uniform sampler2D normalSampler;
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

float getNormalCoeff(vec3 normal, sampler2D normals, vec2 uv) {
	vec3 normalSampled = texture2D(normals, uv).rgb;

	return max(0., dot(normal, normalSampled));
}

float getDepthCoeff(float depth, sampler2D depths, vec2 uv, float depthLimit) {
	float depthSampled = texture2D(depths, uv).r;

	return smoothstep(depthLimit, 0., abs(depthSampled - depth));
}

vec4 blur13DNAware(sampler2D image, sampler2D normals, sampler2D depths, vec2 uv, float resolution, vec2 direction, vec2 nearFar) {
    vec4 color = vec4(0.0);
    vec2 off1 = vec2(1.411764705882353) * direction;
    vec2 off2 = vec2(3.2941176470588234) * direction;
    vec2 off3 = vec2(5.176470588235294) * direction;

    vec3 normal = texture2D(normals, uv).rgb;
    float depth = abs(texture2D(depths, uv).r);
    float weightSum = 0.;
    float weight = 0.;
    float depthLimit = (nearFar.y - nearFar.x) / 1000.0;

    weight = 0.1964825501511404;
    weightSum += weight;
    color += texture2D(image, uv) * weight;

    weight = 0.2969069646728344 * getNormalCoeff(normal, normals, uv + (off1 / resolution)) * getDepthCoeff(depth, depths, uv + (off1 / resolution), depthLimit);
    weightSum += weight;
    color += texture2D(image, uv + (off1 / resolution)) * weight;

    weight = 0.2969069646728344 * getNormalCoeff(normal, normals, uv - (off1 / resolution)) * getDepthCoeff(depth, depths, uv - (off1 / resolution), depthLimit);
    weightSum += weight;
    color += texture2D(image, uv - (off1 / resolution)) * weight;

    weight = 0.09447039785044732 * getNormalCoeff(normal, normals, uv + (off2 / resolution)) * getDepthCoeff(depth, depths, uv + (off2 / resolution), depthLimit);
    weightSum += weight;
    color += texture2D(image, uv + (off2 / resolution)) * weight;

    weight = 0.09447039785044732 * getNormalCoeff(normal, normals, uv - (off2 / resolution)) * getDepthCoeff(depth, depths, uv - (off2 / resolution), depthLimit);
    weightSum += weight;
    color += texture2D(image, uv - (off2 / resolution)) * weight;

    weight = 0.010381362401148057 * getNormalCoeff(normal, normals, uv + (off3 / resolution)) * getDepthCoeff(depth, depths, uv + (off3 / resolution), depthLimit);
    weightSum += weight;
    color += texture2D(image, uv + (off3 / resolution)) * weight;

    weight = 0.010381362401148057 * getNormalCoeff(normal, normals, uv - (off3 / resolution)) * getDepthCoeff(depth, depths, uv - (off3 / resolution), depthLimit);
    weightSum += weight;
    color += texture2D(image, uv - (off3 / resolution)) * weight;

    return color / weightSum;
}

vec4 blur13Bilateral(sampler2D image, vec2 uv, float resolution, vec2 direction) {
  vec4 color = vec4(0.0);
  vec2 off1 = vec2(1.411764705882353) * direction;
  vec2 off2 = vec2(3.2941176470588234) * direction;
  vec2 off3 = vec2(5.176470588235294) * direction;

  float compareDepth = abs(texture2D(depthSampler, uv).r);
  float sampleDepth;
  float weight;
  float weightSum = 30.0;

  color += texture2D(image, uv) * 30.0;

  sampleDepth = abs(texture2D(depthSampler, uv + (off1 / resolution)).r);
  weight = clamp(1.0 / ( 0.003 + abs(compareDepth - sampleDepth)), 0.0, 30.0);
  weightSum +=  weight;
  color += texture2D(image, uv + (off1 / resolution)) * weight;

  sampleDepth = abs(texture2D(depthSampler, uv - (off1 / resolution)).r);
  weight = clamp(1.0 / ( 0.003 + abs(compareDepth - sampleDepth)), 0.0, 30.0);
  weightSum +=  weight;
  color += texture2D(image, uv - (off1 / resolution)) * weight;

  sampleDepth = abs(texture2D(depthSampler, uv + (off2 / resolution)).r);
  weight = clamp(1.0 / ( 0.003 + abs(compareDepth - sampleDepth)), 0.0, 30.0);
  weightSum += weight;
  color += texture2D(image, uv + (off2 / resolution)) * weight;

  sampleDepth = abs(texture2D(depthSampler, uv - (off2 / resolution)).r);
  weight = clamp(1.0 / ( 0.003 + abs(compareDepth - sampleDepth)), 0.0, 30.0);
  weightSum += weight;
  color += texture2D(image, uv - (off2 / resolution)) * weight;

  sampleDepth = abs(texture2D(depthSampler, uv + (off3 / resolution)).r);
  weight = clamp(1.0 / ( 0.003 + abs(compareDepth - sampleDepth)), 0.0, 30.0);
  weightSum += weight;
  color += texture2D(image, uv + (off3 / resolution)) * weight;

  sampleDepth = abs(texture2D(depthSampler, uv - (off3 / resolution)).r);
  weight = clamp(1.0 / ( 0.003 + abs(compareDepth - sampleDepth)), 0.0, 30.0);
  weightSum += weight;
  color += texture2D(image, uv - (off3 / resolution)) * weight;

  return color / weightSum;
}

void main()
{
	vec4 color;
	#ifdef BILATERAL_BLUR_H
	vec2 direction = vec2(1.0, 0.0);
	color = blur13DNAware(textureSampler, normalSampler, depthSampler, vUV, outSize, direction, vec2(near, far));
	#else
	vec2 direction = vec2(0.0, 1.0);
	color = blur13DNAware(textureSampler, normalSampler, depthSampler, vUV, outSize, direction, vec2(near, far));
	#endif

	gl_FragColor.rgb = vec3(color.r);
	gl_FragColor.a = 1.0;
}
#endif
