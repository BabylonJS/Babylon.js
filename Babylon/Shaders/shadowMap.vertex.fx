#ifdef GL_ES
precision mediump float;
#endif

// Attribute
attribute vec3 position;

// Uniform
uniform mat4 worldViewProjection;

void main(void)
{
	gl_Position = worldViewProjection * vec4(position, 1.0);
}