var grlColors: texture_2d<f32>;
var grlColorsSampler: sampler;

// uniform grlUseColors: f32;
// uniform grlUseDash: f32;
// uniform grlDashArray: f32;
// uniform grlDashOffset: f32;
// uniform grlDashRatio: f32;
// uniform grlVisibility: f32;
// uniform grlColorsWidth: f32;
// uniform grl_colorModeAndColorDistributionType: vec2f;
// uniform grlColor: vec3f;

struct GrlUBO {
    grl_colorModeAndColorDistributionType: vec2f,
    grlWidth: f32
};

var<uniform> grlUBO: GrlUBO;

varying grlCounters: f32;
varying grlColorPointer: f32;

#define CUSTOM_FRAGMENT_DEFINITIONS

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {

    #define CUSTOM_FRAGMENT_MAIN_BEGIN

    let grlColorMode: f32 = grlUBO.grl_colorModeAndColorDistributionType.x;
    let grlColorDistributionType: f32 = grlUBO.grl_colorModeAndColorDistributionType.y;

    fragmentOutputs.color = vec4(grlColor, 1.);

    fragmentOutputs.color.a = step(grlCounters, grlVisibility);
    if (fragmentOutputs.color.a == 0.) {
        discard;
    }

    if( grlUseDash == 1. ){
        fragmentOutputs.color.a = ceil(mod(grlCounters + grlDashOffset, grlDashArray) - (grlDashArray * grlDashRatio));
        if (fragmentOutputs.color.a == 0.) {
            discard;
        }
    }

    if (grlUseColors == 1.) {
        var textureColor: vec4f;
        if (grlColorDistributionType == COLOR_DISTRIBUTION_TYPE_LINE) { // TYPE_SEGMENT = 0, TYPE_LINE = 1
           textureColor = textureSample(grlColors, grlColorsSampler, vec2(grlCounters, 0.), 0.);
        } else {
           textureColor = textureSample(grlColors, grlColorsSampler, vec2(grlColorPointer/grlColorsWidth, 0.), 0.);
        }

        if (grlColorMode == COLOR_MODE_SET) {
            fragmentOutputs.color = textureColor;
        } else if (grlColorMode == COLOR_MODE_ADD) {
            fragmentOutputs.color += textureColor;
        } else if (grlColorMode == COLOR_MODE_MULTIPLY) {
            fragmentOutputs.color *= textureColor;
        }
    }

    #define CUSTOM_FRAGMENT_MAIN_END

}
