precision highp float;

// Attributes
attribute vec3 position;
attribute vec3 normal;

// Uniforms
uniform mat4 worldViewProjection;

uniform float width;

void main(void) {
	vec4 viewPosition = worldViewProjection * vec4(position, 1.0);
	vec4 viewNormal = worldViewProjection * vec4(normal, 0.0);
	vec3 direction = cross(viewNormal.xyz, vec3(0., 0., 1.));

	direction = normalize(direction);
	viewPosition.xy += direction.xy *  width;

	gl_Position = viewPosition;
}