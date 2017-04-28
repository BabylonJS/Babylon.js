
#ifdef VERTEXCOLOR
varying vec4 vColor;
#else
uniform vec4 color;
#endif

void main(void) {
#ifdef VERTEXCOLOR
	gl_FragColor = vColor;
#else
	gl_FragColor = color;
#endif
}