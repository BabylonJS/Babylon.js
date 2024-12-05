#define PI 3.1415927
varying vUV: vec2f;

var cdfy: texture_2d<f32>;

fn fetchCDF(y: u32, invocationId: u32) -> f32 {
    return textureLoad(cdfy,  vec2u(invocationId, y), 0).x;
}

fn bisect(size: u32, targetValue: f32, invocationId: u32) -> f32
{
    var a: u32 = 0;
    var b = size - 1;
    while (b - a > 1) {
        var c = (a + b) >> 1;
        if (fetchCDF(c, invocationId) < targetValue) {
            a = c;
        }
        else {
            b = c;
        }
    }
    return mix( f32(a),  f32(b), (targetValue - fetchCDF(a, invocationId)) / (fetchCDF(b, invocationId) - fetchCDF(a,invocationId))) /  f32(size - 1);
}

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
    var cdfSize: vec2u = textureDimensions(cdfy, 0);
    var cdfHeight: u32 = cdfSize.y;
    var currentPixel: vec2u =  vec2u(fragmentInputs.position.xy);

    if (currentPixel.y == 0) {
        fragmentOutputs.color =  vec4f(0.0);
    }
    else if (currentPixel.y == cdfHeight - 2) {
        fragmentOutputs.color =  vec4f(1.0);
    } else {
        var targetValue: f32 = fetchCDF(cdfHeight - 1, currentPixel.x) * input.vUV.y;
        fragmentOutputs.color =  vec4f( vec3f(bisect(cdfHeight, targetValue, currentPixel.x)), 1.0);
    }
}