// SSAO Shader
uniform sampler2D textureSampler;

varying vec2 vUV;

#ifdef SSAO
uniform sampler2D randomSampler;

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

void main()
{
	vec3 random = normalize(texture2D(randomSampler, vUV * randTextureTiles).rgb);
	float depth = texture2D(textureSampler, vUV).r;
	vec3 position = vec3(vUV, depth);
	vec3 normal = normalFromDepth(depth, vUV);
	float radiusDepth = radius / depth;
	float occlusion = 0.0;

	vec3 ray;
	vec3 hemiRay;
	float occlusionDepth;
	float difference;

	for (int i = 0; i < SAMPLES; i++)
	{
		ray = radiusDepth * reflect(sampleSphere[i], random);
		hemiRay = position + sign(dot(ray, normal)) * ray;

		occlusionDepth = texture2D(textureSampler, clamp(hemiRay.xy, vec2(0.001, 0.001), vec2(0.999, 0.999))).r;
		difference = depth - occlusionDepth;

		occlusion += step(fallOff, difference) * (1.0 - smoothstep(fallOff, area, difference));
	}

	float ao = 1.0 - totalStrength * occlusion * samplesFactor;
	float result = clamp(ao + base, 0.0, 1.0);

	gl_FragColor.r = result;
	gl_FragColor.g = result;
	gl_FragColor.b = result;
	gl_FragColor.a = 1.0;
}
#endif
