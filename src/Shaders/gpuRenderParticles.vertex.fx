#version 300 es

// Particles state
in vec3 position;
in float age;
in float life;
in vec3 velocity;

void main() {
  gl_PointSize = 1.0;
  gl_Position = vec4(position, 1.0);
}