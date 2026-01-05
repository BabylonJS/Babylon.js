
#define pbr_inline
fn conductorReflectance(baseColor: vec3f, specularColor: vec3f, specularWeight: f32) -> ReflectanceParams
{
    var outParams: ReflectanceParams;

    #if (CONDUCTOR_SPECULAR_MODEL == CONDUCTOR_SPECULAR_MODEL_OPENPBR)
        outParams.coloredF0 = baseColor * specularWeight;
        outParams.coloredF90 = specularColor * specularWeight;
    #else
        outParams.coloredF0 = baseColor;
        outParams.coloredF90 = vec3f(1.0f);
    #endif
    outParams.F0 = 1.0f;
    outParams.F90 = 1.0f;
    return outParams;
}