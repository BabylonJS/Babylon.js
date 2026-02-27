#include<__decl__gaussianSplattingVertex>

uniform vec2 invViewport;
uniform vec2 dataTextureSize;
uniform vec2 focal;
uniform float kernelSize;
uniform float alpha;

uniform sampler2D covariancesATexture;
uniform sampler2D covariancesBTexture;
uniform sampler2D centersTexture;
uniform sampler2D colorsTexture;

#if IS_COMPOUND
uniform mat4 partWorld[MAX_PART_COUNT];
uniform float partVisibility[MAX_PART_COUNT];
uniform sampler2D partIndicesTexture;
#endif

varying vec2 vPosition;
varying vec4 vColor;

#include<gaussianSplatting>

#ifdef DEPTH_RENDER
uniform vec2 depthValues;
varying float vDepthMetric;
#endif

void main(void) {
    float splatIndex = getSplatIndex(int(position.z + 0.5));
    Splat splat = readSplat(splatIndex);
    vec3 covA = splat.covA.xyz;
    vec3 covB = vec3(splat.covA.w, splat.covB.xy);

#if IS_COMPOUND
    mat4 splatWorld = getPartWorld(splat.partIndex);
#else
    mat4 splatWorld = world;
#endif

    vec4 worldPosGS = splatWorld * vec4(splat.center.xyz, 1.0);

    vPosition = position.xy;
    vColor = splat.color;
    vColor.w *= alpha;

#if IS_COMPOUND
    // Apply part visibility (0.0 to 1.0) to alpha
    vColor.w *= partVisibility[splat.partIndex];
#endif

    gl_Position = gaussianSplatting(position.xy, worldPosGS.xyz, vec2(1.,1.), covA, covB, splatWorld, view, projection);
#ifdef DEPTH_RENDER
    #ifdef USE_REVERSE_DEPTHBUFFER
        vDepthMetric = ((-gl_Position.z + depthValues.x) / (depthValues.y));

    #else
        vDepthMetric = ((gl_Position.z + depthValues.x) / (depthValues.y));
    #endif
#endif
}