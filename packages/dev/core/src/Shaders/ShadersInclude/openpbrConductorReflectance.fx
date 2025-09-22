
#define pbr_inline
ReflectanceParams conductorReflectance(in vec3 baseColor, in vec3 specularColor, in float specularWeight)
{
    ReflectanceParams outParams;

    #if (CONDUCTOR_SPECULAR_MODEL == CONDUCTOR_SPECULAR_MODEL_OPENPBR)
        outParams.coloredF0 = baseColor * specularWeight;
        outParams.coloredF90 = specularColor * specularWeight;
    #else
        outParams.coloredF0 = baseColor;
        outParams.coloredF90 = vec3(1.0);
    #endif
    outParams.F0 = 1.0;
    outParams.F90 = 1.0;
    return outParams;
}