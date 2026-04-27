// Reflection
#ifdef REFLECTION
    #ifdef REFLECTIONMAP_3D
        var reflectionSamplerSampler: sampler;
        var reflectionSampler: texture_cube<f32>;

        #ifdef LODBASEDMICROSFURACE
        #else
            var reflectionLowSamplerSampler: sampler;
            var reflectionLowSampler: texture_cube<f32>;
            var reflectionHighSamplerSampler: sampler;
            var reflectionHighSampler: texture_cube<f32>;
        #endif

        #ifdef USEIRRADIANCEMAP
            var irradianceSamplerSampler: sampler;
            var irradianceSampler: texture_cube<f32>;
        #endif
    #else

        var reflectionSamplerSampler: sampler;
        var reflectionSampler: texture_2d<f32>;

        #ifdef LODBASEDMICROSFURACE
        #else
            var reflectionLowSamplerSampler: sampler;
            var reflectionLowSampler: texture_2d<f32>;
            var reflectionHighSamplerSampler: sampler;
            var reflectionHighSampler: texture_2d<f32>;
        #endif

        #ifdef USEIRRADIANCEMAP
            var irradianceSamplerSampler: sampler;
            var irradianceSampler: texture_2d<f32>;
        #endif
    #endif

    #ifdef REFLECTIONMAP_SKYBOX
        varying vPositionUVW: vec3f;
    #else
        #if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)
            varying vDirectionW: vec3f;
        #endif
    #endif
#endif
