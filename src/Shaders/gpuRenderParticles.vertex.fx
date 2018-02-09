#version 300 es

uniform mat4 view;
uniform mat4 projection;

// Particles state
in vec3 position;
in float age;
in float life;
in float size;
in vec4 color;
in vec2 offset;
in vec2 uv;

out vec2 vUV;
out vec4 vColor;

void main() {
  vUV = uv;
  float ratio = 1.0 - age / life;
  vColor = color * vec4(ratio);

  // Expand position
  vec4 viewPosition = view * vec4(position, 1.0);
  gl_Position = projection * (viewPosition + vec4(offset * size, 0, 1.0));
}