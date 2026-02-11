#include<__decl__gaussianSplattingVertex>

// Uniforms
uniform vec2 invViewport;
uniform vec2 dataTextureSize;
uniform vec2 focal;
uniform float kernelSize;
uniform float alpha;

#if IS_COMPOUND
uniform mat4 partWorld[MAX_PART_COUNT];
uniform float partVisibility[MAX_PART_COUNT];
uniform float partMeshID[MAX_PART_COUNT];
uniform sampler2D partIndicesTexture;
#else
uniform float meshID;
#endif

uniform sampler2D covariancesATexture;
uniform sampler2D covariancesBTexture;
uniform sampler2D centersTexture;
uniform sampler2D colorsTexture;

varying vec2 vPosition;
flat varying float vMeshID;

#include<gaussianSplatting>

void main () {
    float splatIndex = getSplatIndex(int(position.z + 0.5));
    Splat splat = readSplat(splatIndex);
    vec3 covA = splat.covA.xyz;
    vec3 covB = vec3(splat.covA.w, splat.covB.xy);

#if IS_COMPOUND
    mat4 splatWorld = getPartWorld(splat.partIndex);
    vMeshID = partMeshID[splat.partIndex];

    // Hide invisible parts
    if (partVisibility[splat.partIndex] <= 0.0) {
        gl_Position = vec4(0.0, 0.0, 2.0, 1.0);
        return;
    }
#else
    mat4 splatWorld = world;
    vMeshID = meshID;
#endif

    vec4 worldPos = splatWorld * vec4(splat.center.xyz, 1.0);
    vPosition = position.xy;

    // Hide fully transparent splats
    float splatAlpha = splat.color.w * alpha;
#if IS_COMPOUND
    splatAlpha *= partVisibility[splat.partIndex];
#endif
    if (splatAlpha <= 0.0) {
        gl_Position = vec4(0.0, 0.0, 2.0, 1.0);
        return;
    }

    gl_Position = gaussianSplatting(position.xy, worldPos.xyz, vec2(1.,1.), covA, covB, splatWorld, view, projection);
}
