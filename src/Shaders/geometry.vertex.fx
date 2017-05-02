#version 300 es

precision highp float;
precision highp int;

in vec3 position;
in vec3 normal;

// Uniform
uniform mat4 viewProjection;
uniform mat4 world;
uniform mat4 view;

out vec3 vNormalV;

void main(void)
{
	vNormalV = normalize(vec3((view * world) * vec4(normal, 0.0)));
	gl_Position = viewProjection * world * vec4(position, 1.0);
}