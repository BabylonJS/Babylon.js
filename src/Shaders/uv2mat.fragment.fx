// Attributes
in vec2 vUV2;

const float resolution = 8.0;

vec3 encode(vec2 uv) {
	return vec3(floor(uv.x * resolution) / resolution, floor(uv.y * resolution) / resolution, 0.0);
}

void main(void) {
	// bool xParity = (mod(vUV2.x * 10.0, 2.) < 1.0);
	// bool yParity = (mod(vUV2.y * 10.0, 2.) < 1.0);
	// gl_FragColor = vec4(1.0, xParity ^^ yParity, xParity ^^ yParity, 1.);

	gl_FragColor = vec4(encode(vUV2), 1.0);
}