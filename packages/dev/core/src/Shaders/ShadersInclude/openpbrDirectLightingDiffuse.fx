#ifdef LIGHT{X}
    vec4 diffuse{X} = light{X}.vLightDiffuse;
    
    #ifdef HEMILIGHT{X}
        info{X}.diffuse = computeHemisphericDiffuseLighting(preInfo{X}, diffuse{X}.rgb, light{X}.vLightGround);
    #elif defined(AREALIGHT{X})
        info{X}.diffuse = computeAreaDiffuseLighting(preInfo{X}, diffuse{X}.rgb);
    #else
        info{X}.diffuse = computeDiffuseLighting(preInfo{X}, diffuse{X}.rgb);
    #endif

    #ifdef PROJECTEDLIGHTTEXTURE{X}
        info{X}.diffuse *= computeProjectionTextureDiffuseLighting(projectionLightTexture{X}, textureProjectionMatrix{X}, vPositionW);
    #endif

    numLights += 1.0;

    #ifndef SHADOWONLY
        #ifdef SHADOWCSMDEBUG{X}
            baseDiffuseDirectLight += info{X}.diffuse * shadowDebug{X};
        #else
            baseDiffuseDirectLight += info{X}.diffuse * shadow{X};
        #endif
    #endif
#endif