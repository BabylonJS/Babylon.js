precision highp float;

uniform sampler2D grlColors;
uniform float grlUseColors;
uniform float grlUseDash;
uniform float grlDashArray;
uniform float grlDashOffset;
uniform float grlDashRatio;
uniform float grlVisibility;
uniform float grlColorsWidth;
uniform vec2 grl_colorModeAndColorDistributionType;
uniform vec3 grlColor;

varying float grlCounters;
varying float grlColorPointer;

void main() {
    float grlColorMode = grl_colorModeAndColorDistributionType.x;
    float grlColorDistributionType = grl_colorModeAndColorDistributionType.y;

    gl_FragColor = vec4(grlColor, 1.);

    gl_FragColor.a = step(grlCounters, grlVisibility);
    if (gl_FragColor.a == 0.) discard;

    if( grlUseDash == 1. ){
        gl_FragColor.a = ceil(mod(grlCounters + grlDashOffset, grlDashArray) - (grlDashArray * grlDashRatio));
        if (gl_FragColor.a == 0.) discard;
    }

    if (grlUseColors == 1.) {
        vec4 textureColor;
        if (grlColorDistributionType==COLOR_DISTRIBUTION_TYPE_LINE) { // TYPE_SEGMENT = 0, TYPE_LINE = 1
           textureColor = texture2D(grlColors, vec2(grlCounters, 0.), 0.);
        } else {
           textureColor = texture2D(grlColors, vec2(grlColorPointer/grlColorsWidth, 0.), 0.);
        }

        if (grlColorMode == COLOR_MODE_SET) {
            gl_FragColor = textureColor;
        } else if (grlColorMode == COLOR_MODE_ADD) {
            gl_FragColor += textureColor;
        } else if (grlColorMode == COLOR_MODE_MULTIPLY) {
            gl_FragColor *= textureColor;
        }
    }
}
