precision highp float;
#include<instancesDeclaration>

attribute float grl_widths;
attribute vec3 grl_offsets;
attribute float grl_colorPointers;
attribute vec3 position;
uniform mat4 viewProjection;
uniform mat4 projection;
varying float grlCounters;
varying float grlColorPointer;

#ifdef GREASED_LINE_CAMERA_FACING
    attribute vec4 grl_nextAndCounters;
    attribute vec4 grl_previousAndSide;
    uniform vec2 grlResolution;
    uniform float grlAspect;
    uniform float grlWidth;
    uniform float grlSizeAttenuation;

    vec2 grlFix( vec4 i, float aspect ) {
        vec2 res = i.xy / i.w;
        res.x *= aspect;
        return res;
    }
#else
    attribute vec3 grl_slopes;
    attribute float grl_counters;
#endif

void main() {
    #include<instancesVertex>

    grlColorPointer = grl_colorPointers;
    mat4 grlMatrix = viewProjection * finalWorld ;

    #ifdef GREASED_LINE_CAMERA_FACING
        float grlBaseWidth = grlWidth;

        vec3 grlPrevious = grl_previousAndSide.xyz;
        float grlSide = grl_previousAndSide.w;

        vec3 grlNext = grl_nextAndCounters.xyz;
        grlCounters = grl_nextAndCounters.w;
        float grlWidth = grlBaseWidth * grl_widths;

        vec3 positionUpdated = position + grl_offsets;
        vec3 worldDir = normalize(grlNext - grlPrevious);
        vec3 nearPosition = positionUpdated + (worldDir * 0.001);
        vec4 grlFinalPosition = grlMatrix * vec4( positionUpdated , 1.0);
        vec4 screenNearPos = grlMatrix * vec4(nearPosition, 1.0);
        vec2 grlLinePosition = grlFix(grlFinalPosition, grlAspect);
        vec2 grlLineNearPosition = grlFix(screenNearPos, grlAspect);
        vec2 grlDir = normalize(grlLineNearPosition - grlLinePosition);

        vec4 grlNormal = vec4( -grlDir.y, grlDir.x, 0., 1. );
        #ifdef GREASED_LINE_RIGHT_HANDED_COORDINATE_SYSTEM
            grlNormal.xy *= -.5 * grlWidth;
        #else
            grlNormal.xy *= .5 * grlWidth;
        #endif

        grlNormal *= projection;
        if (grlSizeAttenuation == 1.) {
            grlNormal.xy *= grlFinalPosition.w;
            grlNormal.xy /= ( vec4( grlResolution, 0., 1. ) * projection ).xy;
        }
        grlFinalPosition.xy += grlNormal.xy * grlSide;
        gl_Position = grlFinalPosition;
    #else
        grlCounters = grl_counters;
        vec4 grlFinalPosition = grlMatrix * vec4( (position + grl_offsets) + grl_slopes * grl_widths , 1.0 ) ;
        gl_Position = grlFinalPosition;
    #endif
}
