#include<__decl__gaussianSplattingVertex>

#ifdef LOGARITHMICDEPTH
#extension GL_EXT_frag_depth : enable
#endif

#include<clipPlaneVertexDeclaration>
#include<fogVertexDeclaration>
#include<logDepthDeclaration>

// Attributes
attribute float splatIndex;

// Uniforms
uniform vec2 invViewport;
uniform vec2 dataTextureSize;
uniform vec2 focal;

uniform sampler2D covariancesATexture;
uniform sampler2D covariancesBTexture;
uniform sampler2D centersTexture;
uniform sampler2D colorsTexture;

// Output
varying vec4 vColor;
varying vec2 vPosition;

#include<gaussianSplatting>

void main () {
    Splat splat = readSplat(splatIndex);
    vec3 covA = splat.covA;
    vec3 covB = splat.covB;

    vec4 worldPos = world * vec4(splat.center, 1.0);

    mat4 modelView = view * world;
    vec4 camspace = view * worldPos;
    vec4 pos2d = projection * camspace;

    vColor = splat.color;
    vPosition = position;

    gl_Position = gaussianSplatting(position, worldPos.xyz, vec3(1.,1.,1.), covA, covB, view, projection);

#include<clipPlaneVertex>
#include<fogVertex>
#include<logDepthVertex>
}
