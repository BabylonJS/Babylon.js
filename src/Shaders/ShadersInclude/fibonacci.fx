#define rcp(x) 1. / x
#define GOLDEN_RATIO 1.618033988749895
#define TWO_PI 6.2831855

vec2 Golden2dSeq(int i, float n)
{
    // GoldenAngle = 2 * Pi * (1 - 1 / GoldenRatio).
    // We can drop the "1 -" part since all it does is reverse the orientation.
    return vec2(float(i) / n + (0.5 / n), fract(float(i) * rcp(GOLDEN_RATIO)));
}

vec2 SampleDiskGolden(int i, int sampleCount)
{
    vec2 f = Golden2dSeq(i, float(sampleCount));
    return vec2(sqrt(f.x), TWO_PI * f.y);
}