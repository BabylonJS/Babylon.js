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


        vec3 grlPositionOffset = grl_offsets;
        vec4 grlFinalPosition = grlMatrix * vec4( position + grlPositionOffset , 1.0 );
        vec4 grlPrevPos = grlMatrix * vec4( grlPrevious + grlPositionOffset, 1.0 );
        vec4 grlNextPos = grlMatrix * vec4( grlNext + grlPositionOffset, 1.0 );

        vec2 grlCurrentP = grlFix( grlFinalPosition, grlAspect );
        vec2 grlPrevP = grlFix( grlPrevPos, grlAspect );
        vec2 grlNextP = grlFix( grlNextPos, grlAspect );

        float grlWidth = grlBaseWidth * grl_widths;

        vec2 grlDir;
        if( grlNextP == grlCurrentP ) grlDir = normalize( grlCurrentP - grlPrevP );
        else if( grlPrevP == grlCurrentP ) grlDir = normalize( grlNextP - grlCurrentP );
        else {
            vec2 grlDir1 = normalize( grlCurrentP - grlPrevP );
            vec2 grlDir2 = normalize( grlNextP - grlCurrentP );
            grlDir = normalize( grlDir1 + grlDir2 );
        }
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
