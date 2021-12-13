#include<clipPlaneFragmentDeclaration>

uniform vec4 color;

void main(void) {

#define CUSTOM_FRAGMENT_MAIN_BEGIN

    #include<clipPlaneFragment>
	gl_FragColor = color;

#define CUSTOM_FRAGMENT_MAIN_END
}