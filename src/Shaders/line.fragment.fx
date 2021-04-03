#include<clipPlaneFragmentDeclaration>

uniform vec4 color;

void main(void) {
    #include<clipPlaneFragment>
	gl_FragColor = color;
}