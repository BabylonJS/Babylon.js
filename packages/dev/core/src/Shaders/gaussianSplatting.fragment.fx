#include<clipPlaneFragmentDeclaration>
#include<logDepthDeclaration>
#include<fogFragmentDeclaration>

varying vec4 vColor;
varying vec2 vPosition;

#define CUSTOM_FRAGMENT_DEFINITIONS

#include<gaussianSplattingFragmentDeclaration>

void main () {
#define CUSTOM_FRAGMENT_MAIN_BEGIN

#include<clipPlaneFragment>

    vec4 finalColor = gaussianColor(vColor);

#define CUSTOM_FRAGMENT_BEFORE_FRAGCOLOR

    gl_FragColor = finalColor;

#define CUSTOM_FRAGMENT_MAIN_END
}
