fn rcp(x: f32) -> f32
{
    return 1. / x;
}

const GOLDEN_RATIO = 1.618033988749895;

// Used in screen space subsurface scattering
// http://advances.realtimerendering.com/s2018/Efficient%20screen%20space%20subsurface%20scattering%20Siggraph%202018.pdf
fn Golden2dSeq(i: u32, n: f32) -> vec2f
{
    // GoldenAngle = 2 * Pi * (1 - 1 / GoldenRatio).
    // We can drop the "1 -" part since all it does is reverse the orientation.
    return vec2f(f32(i) / n + (0.5 / n), fract(f32(i) * rcp(GOLDEN_RATIO)));
}

fn SampleDiskGolden(i: u32, sampleCount: u32) -> vec2f
{
    let f = Golden2dSeq(i, f32(sampleCount));
    return vec2f(sqrt(f.x), TWO_PI * f.y);
}
