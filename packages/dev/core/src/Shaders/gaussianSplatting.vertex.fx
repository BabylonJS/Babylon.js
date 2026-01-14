#include<__decl__gaussianSplattingVertex>

#ifdef LOGARITHMICDEPTH
#extension GL_EXT_frag_depth : enable
#endif

#include<clipPlaneVertexDeclaration>
#include<fogVertexDeclaration>
#include<logDepthDeclaration>

#include<helperFunctions>

// Uniforms
uniform vec2 invViewport;
uniform vec2 dataTextureSize;
uniform vec2 focal;
uniform float kernelSize;
uniform vec3 eyePosition;
uniform float alpha;

#if USE_RIG
uniform mat4 rigNodeWorld[MAX_RIG_NODE_COUNT];
#endif

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

#if USE_RIG
uniform highp usampler2D rigNodeIndexTexture;
#endif

// Output
varying vec4 vColor;
varying vec2 vPosition;

#include<gaussianSplatting>
#include<gaussianSplattingRig>

void main () {
    float splatIndex = getSplatIndex(int(position.z + 0.5));
    Splat splat = readSplat(splatIndex);
    vec3 covA = splat.covA.xyz;
    vec3 covB = vec3(splat.covA.w, splat.covB.xy);

#if USE_RIG
    // In case of rig, each splat may have a different world transform
    mat4 splatWorld = getRigNodeWorld(splat.rigNodeIndex);
#else
    mat4 splatWorld = world;
#endif

    vec4 worldPos = splatWorld * vec4(splat.center.xyz, 1.0);

    vColor = splat.color;
    vPosition = position.xy;

#if SH_DEGREE > 0
    mat3 worldRot = mat3(splatWorld);
    mat3 normWorldRot = inverseMat3(worldRot);

    vec3 eyeToSplatLocalSpace = normalize(normWorldRot * (worldPos.xyz - eyePosition));
    vColor.xyz = splat.color.xyz + computeSH(splat, eyeToSplatLocalSpace);
#endif

    vColor.w *= alpha;

    gl_Position = gaussianSplatting(position.xy, worldPos.xyz, vec2(1.,1.), covA, covB, splatWorld, view, projection);

#include<clipPlaneVertex>
#include<fogVertex>
#include<logDepthVertex>
}
