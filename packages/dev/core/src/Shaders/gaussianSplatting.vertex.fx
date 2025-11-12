#include<__decl__gaussianSplattingVertex>

#ifdef LOGARITHMICDEPTH
#extension GL_EXT_frag_depth : enable
#endif

#include<clipPlaneVertexDeclaration>
#include<fogVertexDeclaration>
#include<logDepthDeclaration>

#include<helperFunctions>

// Attributes
attribute vec4 splatIndex0;
attribute vec4 splatIndex1;
attribute vec4 splatIndex2;
attribute vec4 splatIndex3;

// Uniforms
uniform vec2 invViewport;
uniform vec2 dataTextureSize;
uniform vec2 focal;
uniform float kernelSize;
uniform vec3 eyePosition;
uniform vec3 viewDirectionFactor;

uniform sampler2D covariancesATexture;
uniform sampler2D covariancesBTexture;
uniform sampler2D centersTexture;
uniform sampler2D colorsTexture;

#if SH_DEGREE > 0
uniform highp usampler2D shTexture0;
#endif
#if SH_DEGREE > 1
uniform highp usampler2D shTexture1;
#endif
#if SH_DEGREE > 2
uniform highp usampler2D shTexture2;
#endif

// Output
varying vec4 vColor;
varying vec2 vPosition;

#include<gaussianSplatting>

void main () {
    float splatIndex;
    switch (int(position.z + 0.5))
    {
        case 0: splatIndex = splatIndex0.x; break;
        case 1: splatIndex = splatIndex0.y; break;
        case 2: splatIndex = splatIndex0.z; break;
        case 3: splatIndex = splatIndex0.w; break;

        case 4: splatIndex = splatIndex1.x; break;
        case 5: splatIndex = splatIndex1.y; break;
        case 6: splatIndex = splatIndex1.z; break;
        case 7: splatIndex = splatIndex1.w; break;

        case 8: splatIndex = splatIndex2.x; break;
        case 9: splatIndex = splatIndex2.y; break;
        case 10: splatIndex = splatIndex2.z; break;
        case 11: splatIndex = splatIndex2.w; break;

        case 12: splatIndex = splatIndex3.x; break;
        case 13: splatIndex = splatIndex3.y; break;
        case 14: splatIndex = splatIndex3.z; break;
        case 15: splatIndex = splatIndex3.w; break;
    }
    Splat splat = readSplat(splatIndex);
    vec3 covA = splat.covA.xyz;
    vec3 covB = vec3(splat.covA.w, splat.covB.xy);

    vec4 worldPos = world * vec4(splat.center.xyz, 1.0);

    vColor = splat.color;
    vPosition = position.xy;

#if SH_DEGREE > 0
    mat3 worldRot = mat3(world);
    mat3 normWorldRot = inverseMat3(worldRot);

    vec3 dir = normalize(normWorldRot * (worldPos.xyz - eyePosition));
    dir *= viewDirectionFactor;
    vColor.xyz = splat.color.xyz + computeSH(splat, dir);
#endif

    gl_Position = gaussianSplatting(position.xy, worldPos.xyz, vec2(1.,1.), covA, covB, world, view, projection);

#include<clipPlaneVertex>
#include<fogVertex>
#include<logDepthVertex>
}
