vec3 tagLightingForSSS(vec3 color) {
    color.b = max(color.b, HALF_MIN);

    return color;
}

bool testLightingForSSS(vec3 color)
{
    return color.b > 0.;
}