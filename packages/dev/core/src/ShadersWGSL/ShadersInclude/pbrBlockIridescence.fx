struct iridescenceOutParams
{
    iridescenceIntensity: f32,
    iridescenceIOR: f32,
    iridescenceThickness: f32,
    specularEnvironmentR0: vec3f
};

#ifdef IRIDESCENCE
    #define pbr_inline
    #define inline
    fn iridescenceBlock(
        vIridescenceParams: vec4f
        , viewAngle: f32,
        , specularEnvironmentR0: vec3f
        #ifdef IRIDESCENCE_TEXTURE
            , iridescenceMapData: vec2f
        #endif
        #ifdef IRIDESCENCE_THICKNESS_TEXTURE
            , iridescenceThicknessMapData: vec2f
        #endif
        #ifdef CLEARCOAT
            , NdotVUnclamped: f32
            #ifdef CLEARCOAT_TEXTURE
                , clearCoatMapData: vec2f
            #endif
        #endif
    ) -> iridescenceOutParams
    {
        var outParams: iridescenceOutParams;
        var iridescenceIntensity: f32 = vIridescenceParams.x;
        var iridescenceIOR: f32 = vIridescenceParams.y;

        var iridescenceThicknessMin: f32 = vIridescenceParams.z;
        var iridescenceThicknessMax: f32 = vIridescenceParams.w;
        var iridescenceThicknessWeight: f32 = 1.;

        #ifdef IRIDESCENCE_TEXTURE
            iridescenceIntensity *= iridescenceMapData.x;
        #endif

        #if defined(IRIDESCENCE_THICKNESS_TEXTURE)
            iridescenceThicknessWeight = iridescenceThicknessMapData.g;
        #endif

        var iridescenceThickness: f32 = mix(iridescenceThicknessMin, iridescenceThicknessMax, iridescenceThicknessWeight);

        var topIor: f32 = 1.; // Assume air

        #ifdef CLEARCOAT
            // Clear COAT parameters.
            var clearCoatIntensity: f32 = vClearCoatParams.x;
            #ifdef CLEARCOAT_TEXTURE
                clearCoatIntensity *= clearCoatMapData.x;
            #endif

            topIor = mix(1.0, vClearCoatRefractionParams.w - 1., clearCoatIntensity);
            // Infer new NdotV from NdotVUnclamped...
            viewAngle = sqrt(1.0 + square(1.0 / topIor) * (square(NdotVUnclamped) - 1.0));
        #endif

        var iridescenceFresnel: vec3f = evalIridescence(topIor, iridescenceIOR, viewAngle, iridescenceThickness, specularEnvironmentR0);

        outParams.specularEnvironmentR0 = mix(specularEnvironmentR0, iridescenceFresnel, iridescenceIntensity);
        outParams.iridescenceIntensity = iridescenceIntensity;
        outParams.iridescenceThickness = iridescenceThickness;
        outParams.iridescenceIOR = iridescenceIOR;

        return outParams;
    }
#endif
