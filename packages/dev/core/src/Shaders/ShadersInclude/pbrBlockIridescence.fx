struct iridescenceOutParams
{
    float iridescenceIntensity;
    float iridescenceIOR;
    float iridescenceThickness;
    vec3 specularEnvironmentR0;
};

#ifdef IRIDESCENCE
    #define pbr_inline
    #define inline
    void iridescenceBlock(
        in vec4 vIridescenceParams,
        in float viewAngle,
        in vec3 specularEnvironmentR0,
        #ifdef IRIDESCENCE_TEXTURE
            in vec2 iridescenceMapData,
        #endif
        #ifdef IRIDESCENCE_THICKNESS_TEXTURE
            in vec2 iridescenceThicknessMapData,
        #endif
        #ifdef CLEARCOAT
            in float NdotVUnclamped,
            #ifdef CLEARCOAT_TEXTURE
                in vec2 clearCoatMapData,
            #endif
        #endif
        out iridescenceOutParams outParams
    )
    {
        float iridescenceIntensity = vIridescenceParams.x;
        float iridescenceIOR = vIridescenceParams.y;

        float iridescenceThicknessMin = vIridescenceParams.z;
        float iridescenceThicknessMax = vIridescenceParams.w;
        float iridescenceThicknessWeight = 1.;

        #ifdef IRIDESCENCE_TEXTURE
            iridescenceIntensity *= iridescenceMapData.x;

            #ifdef IRIDESCENCE_USE_THICKNESS_FROM_MAINTEXTURE
                iridescenceThicknessWeight = iridescenceMapData.g;
            #endif
        #endif

        #if defined(IRIDESCENCE_THICKNESS_TEXTURE)
            iridescenceThicknessWeight = iridescenceThicknessMapData.g;
        #endif

        float iridescenceThickness = mix(iridescenceThicknessMin, iridescenceThicknessMax, iridescenceThicknessWeight);

        float topIor = 1.; // Assume air

        #ifdef CLEARCOAT
            // Clear COAT parameters.
            float clearCoatIntensity = vClearCoatParams.x;
            #ifdef CLEARCOAT_TEXTURE
                clearCoatIntensity *= clearCoatMapData.x;
            #endif

            topIor = mix(1.0, vClearCoatRefractionParams.w - 1., clearCoatIntensity);
            // Infer new NdotV from NdotVUnclamped...
            viewAngle = sqrt(1.0 + square(1.0 / topIor) * (square(NdotVUnclamped) - 1.0));
        #endif

        vec3 iridescenceFresnel = evalIridescence(topIor, iridescenceIOR, viewAngle, iridescenceThickness, specularEnvironmentR0);

        outParams.specularEnvironmentR0 = mix(specularEnvironmentR0, iridescenceFresnel, iridescenceIntensity);
        outParams.iridescenceIntensity = iridescenceIntensity;
        outParams.iridescenceThickness = iridescenceThickness;
        outParams.iridescenceIOR = iridescenceIOR;
    }
#endif
