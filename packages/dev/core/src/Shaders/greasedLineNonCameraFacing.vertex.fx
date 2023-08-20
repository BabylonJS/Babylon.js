precision highp float;

attribute vec3 grl_slopes;
attribute float grl_counters;
attribute float grl_widths;
// attribute vec3 grl_offsets;
attribute float grl_colorPointers;
varying float grlCounters;
varying float grlColorPointer;

attribute vec3 position;
uniform mat4 worldViewProjection;


void main() {

    vec4 grlFinalPosition = worldViewProjection * vec4( position + grl_slopes * grl_widths /* + grlPositionOffset */, 1.0 ) ;

    gl_Position = grlFinalPosition;

    grlCounters = grl_counters;
    grlColorPointer = grl_colorPointers;
}
