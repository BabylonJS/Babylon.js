#version 300 es

uniform mat4 view;
uniform mat4 projection;

// Particles state
in vec3 position;
in float age;
in float life;
in vec4 color;
in vec2 offset;
in vec2 uv;

out vec2 vUV;
out vec4 vColor;

void main() {
  vUV = uv;
  float ratio = age / life;
  vColor = color * vec4(1. - ratio, 1. - ratio, 1. - ratio, ratio);

  // Expand position
  vec4 viewPosition = view * vec4(position, 1.0);
  gl_Position = projection * (viewPosition + vec4(offset * 0.1, 0, 1.0));
}