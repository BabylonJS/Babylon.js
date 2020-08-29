precision highp float;
varying vec3 vPosition;

varying vec3 vColor;

void main() {
	vec4 color = vec4(vColor, 1.0);
	gl_FragColor = color;
}