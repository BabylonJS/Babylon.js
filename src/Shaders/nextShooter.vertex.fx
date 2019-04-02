// Attributes
in vec2 position;
uniform sampler2D unshotRadiositySampler;
uniform float lod;
uniform float area;

out vec2 vUV;
const vec2 madd = vec2(0.5, 0.5);

void main(void) {
	vUV = position * madd + madd;
	vec3 usr = textureLod(unshotRadiositySampler, vUV, lod).xyz;
	float invEnergy = 1. / ( area * (usr.x + usr.y + usr.z) + 1.);
	gl_Position = vec4(position.x, position.y, invEnergy, 1.0);
}