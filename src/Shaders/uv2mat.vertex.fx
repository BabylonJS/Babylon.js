// Attributes
in vec3 position;
in vec2 uv2;

// Uniforms
uniform mat4 view;

#ifdef HEMICUBE
uniform mat4 projection;
#else
uniform vec2 nearFar;
#endif

uniform mat4 world;

out vec2 vUV2;

#ifdef DEPTH_COMPARE
out float depth;
#endif

void main(void) {
    vUV2 = uv2;

    vec4 viewPos = view * world * vec4(position, 1.0);
    #ifdef HEMICUBE
    vec4 projPos = projection * viewPos;
    gl_Position = projPos;
    #ifdef DEPTH_COMPARE
        depth = viewPos.z;
    #endif
    #else
    float farMinusNear = nearFar.y - nearFar.x;

    // Orthographic projection
    vec3 hemiPt = normalize(viewPos.xyz);

	gl_Position.xy = hemiPt.xy * farMinusNear;
	gl_Position.z = (2.0 * viewPos.z - nearFar.y - nearFar.x);
    gl_Position.w = farMinusNear;
    #ifdef DEPTH_COMPARE
    	// depth was between -1.0 and 1.0
        depth = gl_Position.z / farMinusNear * 0.5 + 0.5;
    #endif
    #endif
}