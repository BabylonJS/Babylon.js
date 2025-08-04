struct ReflectanceParams
{
    F0: f32,
    F90: f32,
    coloredF0: vec3f,
    coloredF90: vec3f,
};

#define pbr_inline
fn dielectricReflectance(
    insideIOR: f32, outsideIOR: f32, specularColor: vec3f, specularWeight: f32
) -> ReflectanceParams
{
    var outParams: ReflectanceParams;

    let dielectricF0 = pow((insideIOR - outsideIOR) / (insideIOR + outsideIOR), 2.0);

    // Compute non-coloured reflectance.
    // reflectanceF0 is the non-coloured reflectance used for blending between the diffuse and specular components.
    // It represents the total percentage of light reflected by the specular lobe at normal incidence.
    // In glTF's material model, the F0 value is multiplied by the maximum component of the specular colour.
    #if DIELECTRIC_SPECULAR_MODEL == DIELECTRIC_SPECULAR_MODEL_GLTF
        let maxF0 = max(specularColor.r, max(specularColor.g, specularColor.b));
        outParams.F0 = dielectricF0 * maxF0 * specularWeight;
    #else
        outParams.F0 = dielectricF0 * specularWeight;
    #endif


    // Scale the reflectanceF90 by the IOR for values less than 1.5.
    // This is an empirical hack to account for the fact that Schlick is tuned for IOR = 1.5
    // and an IOR of 1.0 should result in no visible glancing specular.
    let f90Scale = clamp(2.0f * abs(insideIOR - outsideIOR), 0.0f, 1.0f);
    outParams.F90 = f90Scale * specularWeight;

    // Compute the coloured F0 reflectance.
    // The coloured reflectance is the percentage of light reflected by the specular lobe at normal incidence.
    // In glTF and OpenPBR, it is not the same thing as the percentage of light blocked from penetrating
    // down to the layer below. The non-coloured F0 will be used for this (see below).
    outParams.coloredF0 = vec3f(dielectricF0 * specularWeight) * specularColor.rgb;
    
    // Now, compute the coloured reflectance at glancing angles based on the specular model.
    #if (DIELECTRIC_SPECULAR_MODEL == DIELECTRIC_SPECULAR_MODEL_OPENPBR)
        // In OpenPBR, the F90 is coloured using the specular colour for dielectrics.
        let dielectricColorF90: vec3f = specularColor.rgb * vec3f(f90Scale) * specularWeight;
    #else
        // In glTF, the F90 is white for dielectrics.
        let dielectricColorF90: vec3f = vec3f(f90Scale) * specularWeight;
    #endif
    outParams.coloredF90 = dielectricColorF90;

    return outParams;
}
