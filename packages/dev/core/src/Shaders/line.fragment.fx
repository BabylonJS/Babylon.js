#include<clipPlaneFragmentDeclaration>

uniform vec4 color;


#define CUSTOM_FRAGMENT_DEFINITIONS

void main(void) {

#define CUSTOM_FRAGMENT_MAIN_BEGIN

    #include<clipPlaneFragment>
	gl_FragColor = color;

#define CUSTOM_FRAGMENT_MAIN_END
}