// Attributes
in vec3 position;
in vec2 uv2;

// Uniforms
#ifdef HEMICUBE
uniform mat4 viewProjection;
#else
uniform mat4 view;
#endif

uniform mat4 world;
uniform vec2 nearFar;

out vec2 vUV2;

#ifdef DEPTH_COMPARE
out float depth;
#endif

void main(void) {
    vUV2 = uv2;

    #ifdef HEMICUBE
    vec4 projection = viewProjection * world * vec4(position, 1.0);
    gl_Position = projection;
    #else
    vec4 viewPos = view * world * vec4(position, 1.0);

    // Orthographic projection
    vec3 hemiPt = normalize(viewPos.xyz);
	float farMinusNear = nearFar.y - nearFar.x;

	gl_Position.xy = hemiPt.xy * farMinusNear;
	gl_Position.z = (2.0 * viewPos.z - nearFar.y - nearFar.x);
    gl_Position.w = farMinusNear;
    #endif
    #ifdef DEPTH_COMPARE
    	// depth was between -1.0 and 1.0
        depth = gl_Position.z / farMinusNear * 0.5 + 0.5;
    #endif
}