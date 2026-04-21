#include<__decl__gaussianSplattingVertex>

uniform vec2 dataTextureSize;
uniform float alpha;
uniform mat4 invWorldScale;
uniform mat4 viewMatrix;

uniform sampler2D rotationsATexture;
uniform sampler2D rotationsBTexture;
uniform sampler2D rotationScaleTexture;
uniform sampler2D centersTexture;
uniform sampler2D colorsTexture;

#if IS_COMPOUND
uniform mat4 partWorld[MAX_PART_COUNT];
uniform float partVisibility[MAX_PART_COUNT];
uniform sampler2D partIndicesTexture;
#endif

varying vec3 vNormalizedPosition;
varying vec3 vNormalizedCenterPosition;
varying float vAlpha;
varying vec2 vPatchPosition;

#include<gaussianSplatting>

void main(void) {
    float splatIndex = getSplatIndex(int(position.z + 0.5));
    Splat splat = readSplat(splatIndex);

#if IS_COMPOUND
    mat4 splatWorld = getPartWorld(splat.partIndex);
#else
    mat4 splatWorld = world;
#endif

    vec4 worldPos = computeVoxelSplatWorldPos(splat.rotationA, splat.rotationB, splat.rotationScale, splat.center.xyz, splatWorld, viewMatrix, invWorldScale, position.xy);

    gl_Position = viewMatrix * invWorldScale * worldPos;
    vNormalizedPosition = gl_Position.xyz * 0.5 + 0.5;

    vec4 viewCenterPos = viewMatrix * invWorldScale * splatWorld * vec4(splat.center.xyz, 1.0);
    vNormalizedCenterPosition = viewCenterPos.xyz * 0.5 + 0.5;

    vAlpha = splat.color.w * alpha;
    
#if IS_COMPOUND
    // Apply part visibility (0.0 to 1.0) to alpha
    vAlpha *= partVisibility[splat.partIndex];
#endif

    vPatchPosition = position.xy;
}