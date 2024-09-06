#define PI 3.1415927
varying vUV: vec2f;

var cdfx: texture_2d<f32>;

fn fetchCDF(x: u32) -> f32 {
    return textureLoad(cdfx,  vec2u(x, 0), 0).x;
}

fn bisect(size: u32, targetValue: f32) -> f32
{
    var a: u32 = 0;
    var b = size - 1;
    while (b - a > 1) {
        var c: u32 = (a + b) >> 1;
        if (fetchCDF(c) < targetValue) {
            a = c;
        }
        else {
            b = c;
        }
    }
    return mix( f32(a),  f32(b), (targetValue - fetchCDF(a)) / (fetchCDF(b) - fetchCDF(a))) /  f32(size - 1);
}

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
    var cdfSize: vec2u = textureDimensions(cdfx, 0);
    var cdfWidth: u32 = cdfSize.x;
    var icdfWidth: u32 = cdfWidth - 1;
    var currentPixel: vec2u =  vec2u(fragmentInputs.position.xy);

    if (currentPixel.x == 0)
    {
        fragmentOutputs.color =  vec4f(0.0);
    }
    else if (currentPixel.x == icdfWidth - 1) {
        fragmentOutputs.color =  vec4f(1.0);
    } else {
        var targetValue: f32 = fetchCDF(cdfWidth - 1) * input.vUV.x;
        fragmentOutputs.color =  vec4f( vec3f(bisect(cdfWidth, targetValue)), 1.0);
    }
}