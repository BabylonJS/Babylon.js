#version 300 es

uniform mat4 view;
uniform mat4 projection;

// Particles state
in vec3 position;
in vec2 offset;
in vec2 uv;

out vec2 vUV;

void main() {
  vUV = uv;
  vec4 viewPosition = view * vec4(position, 1.0);

  gl_Position = projection * (viewPosition + vec4(offset * 0.1, 0, 1.0));
}