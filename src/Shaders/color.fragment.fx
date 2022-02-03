
#ifdef VERTEXCOLOR
varying vec4 vColor;
#elif INSTANCESCOLOR
varying vec4 vColor;
#else
uniform vec4 color;
#endif

#include<clipPlaneFragmentDeclaration>


#define CUSTOM_FRAGMENT_DEFINITIONS

void main(void) {

#define CUSTOM_FRAGMENT_MAIN_BEGIN

#include<clipPlaneFragment>

#ifdef VERTEXCOLOR
	gl_FragColor = vColor;
#elif INSTANCESCOLOR
    gl_FragColor = vColor;
#else
	gl_FragColor = color;
#endif

#define CUSTOM_FRAGMENT_MAIN_END
}