struct conductorReflectanceOutParams
{
    vec3 F0;
    vec3 F90;
};

#define pbr_inline
conductorReflectanceOutParams conductorReflectance(in vec3 baseColor, in vec3 specularColor, in float specularWeight)
{
    conductorReflectanceOutParams outParams;

    #if (CONDUCTOR_SPECULAR_MODEL == CONDUCTOR_SPECULAR_MODEL_OPENPBR)
        outParams.F0 = baseColor * specularWeight;
        outParams.F90 = specularColor * specularWeight;
    #else
        outParams.F0 = baseColor;
        outParams.F90 = vec3(1.0);
    #endif
    return outParams;
}