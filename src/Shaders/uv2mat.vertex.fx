// Attributes
in vec3 position;
in vec2 uv2;

// Uniforms
uniform mat4 view;
uniform mat4 world;
uniform vec2 nearFar;

out vec2 vUV2;

void main(void) {
    vec4 viewPos = view * world * vec4(position, 1.0);

    vUV2 = uv2;

    // Orthographic projection
    vec3 hemiPt = normalize(viewPos.xyz);
	float farMinusNear = nearFar.y - nearFar.x;

	gl_Position.xy = hemiPt.xy * farMinusNear;
	gl_Position.z = (2.0 * viewPos.z - nearFar.y - nearFar.x);
    gl_Position.w = farMinusNear;
}