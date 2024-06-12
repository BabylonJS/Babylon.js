
#if defined(INSTANCES)
varying vec4 vMeshID;
#else
uniform vec4 meshID;
#endif

void main(void) {

#if defined(INSTANCES)
    gl_FragColor = vMeshID;
#else
	gl_FragColor = meshID;
#endif

}