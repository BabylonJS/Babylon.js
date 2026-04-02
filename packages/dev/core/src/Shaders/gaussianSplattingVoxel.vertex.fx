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
    mat3 splatRotation = mat3(
        vec3(splat.rotationA.x, splat.rotationA.y, splat.rotationA.z),
        vec3(splat.rotationA.w, splat.rotationB.x, splat.rotationB.y),
        vec3(splat.rotationB.z, splat.rotationB.w, splat.rotationScale.x)
    );
    vec3 splatScale = vec3(splat.rotationScale.y, splat.rotationScale.z, splat.rotationScale.w);

#if IS_COMPOUND
    mat4 splatWorld = getPartWorld(splat.partIndex);
#else
    mat4 splatWorld = world;
#endif

    // Find the splat axis with the longest projection length in view-space Z axis, which indicates the axis 
    // is the one most aligned with the view direction.
    mat3 rotToView = mat3(viewMatrix) * mat3(invWorldScale) * mat3(splatWorld) * splatRotation;
    vec3 axisLengthInViewZ = abs(vec3(rotToView[0][2], rotToView[1][2], rotToView[2][2]));

    float gaussianSplatCutoffStddev = 1.4142135624 / 2.0;
    vec3 offsetSplatSpace;
    if (axisLengthInViewZ.x > axisLengthInViewZ.y && axisLengthInViewZ.x > axisLengthInViewZ.z) {
        offsetSplatSpace = vec3(0.0, position.x, position.y) * splatScale * gaussianSplatCutoffStddev;
    } else if (axisLengthInViewZ.y > axisLengthInViewZ.z) {
        offsetSplatSpace = vec3(position.x, 0.0, position.y) * splatScale * gaussianSplatCutoffStddev;
    } else {
        offsetSplatSpace = vec3(position.x, position.y, 0.0) * splatScale * gaussianSplatCutoffStddev;
    }
    vec3 vertexObjectSpace = splat.center.xyz + splatRotation * offsetSplatSpace;
    vec4 worldPos = splatWorld * vec4(vertexObjectSpace, 1.0);

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