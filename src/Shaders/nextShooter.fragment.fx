// Attributes
uniform sampler2D unshotRadiositySampler;
uniform vec3 polygonId;
uniform float lod;
uniform float area;

in vec2 vUV;

void main(void) {
	vec3 smpl = texture(unshotRadiositySampler, vUV, lod).xyz;
	float invEnergy = 1.0 / ( area * (smpl.x + smpl.y + smpl.z) + 1.);
	// gl_FragColor = vec4(usr, invEnergy);
	gl_FragColor = vec4(polygonId, invEnergy);
}