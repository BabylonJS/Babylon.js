#include<clipPlaneFragmentDeclaration>
#include<logDepthDeclaration>
#include<fogFragmentDeclaration>

varying vec4 vColor;
varying vec2 vPosition;

#include<gaussianSplattingFragmentDeclaration>

void main () {    
#include<clipPlaneFragment>

    gl_FragColor = gaussianColor(vColor);
}
