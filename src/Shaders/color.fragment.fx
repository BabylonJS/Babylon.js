
#ifdef VERTEXCOLOR
varying vec4 vColor;
#else
uniform vec4 color;
#endif

#include<clipPlaneFragmentDeclaration>

void main(void) {
#include<clipPlaneFragment>

#ifdef VERTEXCOLOR
	gl_FragColor = vColor;
#else
	gl_FragColor = color;
#endif
}