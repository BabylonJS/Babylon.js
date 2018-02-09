#version 300 es

uniform sampler2D textureSampler;

in vec2 vUV;

out vec4 outFragColor;

void main() {
  outFragColor = texture(textureSampler, vUV);
}
