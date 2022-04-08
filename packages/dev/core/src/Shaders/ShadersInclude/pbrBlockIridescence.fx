struct iridescenceOutParams
{
    float iridescenceIntensity;
    float iridescenceIOR;
    float iridescenceThickness;
};

#ifdef IRIDESCENCE
    #define pbr_inline
    #define inline
    void iridescenceBlock(
        in vec4 vIridescenceParams,
        #ifdef IRIDESCENCE_TEXTURE
            in vec2 iridescenceMapData,
        #endif
        #ifdef IRIDESCENCE_THICKNESS_TEXTURE
            in vec2 iridescenceThicknessMapData,
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

        outParams.iridescenceIntensity = iridescenceIntensity;
        outParams.iridescenceThickness = iridescenceThickness;
        outParams.iridescenceIOR = iridescenceIOR;
    }
#endif
