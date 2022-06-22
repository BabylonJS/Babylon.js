#if defined(VERTEXCOLOR) || defined(INSTANCESCOLOR)
    vColor = vec4(1.0);
    #ifdef VERTEXCOLOR
        #ifdef VERTEXALPHA
            vColor *= color;
        #else
            vColor.rgb *= color.rgb;
        #endif
    #endif

    #ifdef INSTANCESCOLOR
        vColor *= instanceColor;
    #endif
#endif