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

uniform highp usampler2D shTexture0;
uniform highp usampler2D shTexture1;
uniform highp usampler2D shTexture2;

// Output
varying vec4 vColor;
varying vec2 vPosition;

#include<gaussianSplatting>

void main () {
    Splat splat = readSplat(splatIndex);
    vec3 covA = splat.covA.xyz;
    vec3 covB = vec3(splat.covA.w, splat.covB.xy);

    vec4 worldPos = world * vec4(splat.center.xyz, 1.0);

    vColor = splat.color;
    vPosition = position;

#if SH_DEGREE > 0
    vec3 dir = normalize(worldPos.xyz - vEyePosition.xyz);
    vColor.xyz = computeSH(splat, splat.color.xyz, dir);
#endif

    gl_Position = gaussianSplatting(position, worldPos.xyz, vec2(1.,1.), covA, covB, world, view, projection);

#include<clipPlaneVertex>
#include<fogVertex>
#include<logDepthVertex>
}
