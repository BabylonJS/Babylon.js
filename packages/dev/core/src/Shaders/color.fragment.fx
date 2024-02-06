
#if defined(VERTEXCOLOR) || defined(INSTANCESCOLOR) && defined(INSTANCES)
    #define VERTEXCOLOR
varying vec4 vColor;
#else
uniform vec4 color;
#endif

#include<clipPlaneFragmentDeclaration>
#include<fogFragmentDeclaration>


#define CUSTOM_FRAGMENT_DEFINITIONS

void main(void) {

#define CUSTOM_FRAGMENT_MAIN_BEGIN

#include<clipPlaneFragment>

#if defined(VERTEXCOLOR) || defined(INSTANCESCOLOR) && defined(INSTANCES)
    gl_FragColor = vColor;
#else
	gl_FragColor = color;
#endif

#include<fogFragment>(color,gl_FragColor)

#define CUSTOM_FRAGMENT_MAIN_END
}