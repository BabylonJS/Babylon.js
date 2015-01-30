#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D textureSampler;
uniform sampler2D randomSampler;

uniform vec3 sampleSphere[16];

varying vec2 vUV;

vec3 normalFromDepth(float depth, vec2 coords) {
    const vec2 offset1 = vec2(0.0, 0.001);
    const vec2 offset2 = vec2(0.001, 0.0);

    float depth1 = texture2D(textureSampler, coords + offset1).r;
    float depth2 = texture2D(textureSampler, coords + offset2).r;

    vec3 p1 = vec3(offset1, depth1 - depth);
    vec3 p2 = vec3(offset2, depth2 - depth);

    vec3 normal = cross(p1, p2);
    normal.z = -normal.z;

    return normalize(normal);
}

void main(void) {

	const float totalStrength = 1.0;
	const float base = 0.2;
	const float area = 0.0075;
	const float fallOff = 0.000001;
	const float radius = 0.002;

	vec3 random = normalize(texture2D(randomSampler, vUV * 4.0).rgb);
	float depth = texture2D(textureSampler, vUV).r;

	vec3 position = vec3(vUV, depth);
	vec3 normal = normalFromDepth(depth, vUV);

	float radiusDepth = radius / depth;
	float occlusion = 0.0;

	const int samples = 16;
	for (int i = 0; i < samples; i++) {
		vec3 ray = radiusDepth * reflect(sampleSphere[i], random);
		vec3 hemiRay = position + sign(dot(ray, normal)) * ray;

		float occlusionDepth = texture2D(textureSampler, clamp(hemiRay.xy, 0.0, 1.0)).r;
		float difference = depth - occlusionDepth;

		occlusion += step(fallOff, difference) * (1.0 - smoothstep(fallOff, area, difference));
	}

	float ao = 1.0 - totalStrength * occlusion * (1.0 / float(samples));

	float result = clamp(ao + base, 0.0, 1.0);
	gl_FragColor.r = result;
	gl_FragColor.g = result;
	gl_FragColor.b = result;
	gl_FragColor.a = 1.0;

}
