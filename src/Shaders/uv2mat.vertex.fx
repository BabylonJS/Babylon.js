// Attributes
in vec3 position;
in vec2 uv2;

// Uniforms
uniform mat4 viewProjection;
uniform mat4 world;

out vec2 vUV2;

void main(void) {
    vec4 worldPos = viewProjection * world * vec4(position, 1.0);

    vUV2 = uv2;
	gl_Position = worldPos;
}