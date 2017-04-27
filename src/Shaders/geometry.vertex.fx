#version 300 es

precision highp float;
precision highp int;

in vec3 position;

// Uniform
uniform mat4 viewProjection;
uniform mat4 world;

void main(void)
{
	gl_Position = viewProjection * world * vec4(position, 1.0);
}