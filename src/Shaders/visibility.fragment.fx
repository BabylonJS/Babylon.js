// Uniforms
uniform vec2 nearFar;
uniform float bias;

// Inputs
in vec4 vDepthMetric;
in vec3 vView;

void main(void) {
	// gl_FragColor = vec4(vDepthMetric, 0.0, 0.0, 1.0);

	// get distance between fragment and light source
	// float lightDistance = length(vView);
	
	// // map to [0;1] range by dividing by far_plane
	// lightDistance = (lightDistance + nearFar.x) / nearFar.y;
	// lightDistance += bias;
	
	// // gl_FragColor = vec4(vDepthMetric, 0.0, 0.0, 1.0);
	// gl_FragColor = vec4(vDepthMetric.z / vDepthMetric.w, 0.0, 0.0, 1.0);
	gl_FragColor = vec4(vDepthMetric.z / vDepthMetric.w, 0.0, 0.0, 1.0);
}