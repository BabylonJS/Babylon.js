#ifdef SS_SCATTERING
vec3 tagLightingForSSS(vec3 color) {
    color.b = max(color.b, HALF_MIN);

    return color;
}
#else
vec3 tagLightingForSSS(vec3 color) {
    return vec3(0., 0., 0.);
}
#endif

bool testLightingForSSS(vec3 color)
{
    return color.b > 0.;
}