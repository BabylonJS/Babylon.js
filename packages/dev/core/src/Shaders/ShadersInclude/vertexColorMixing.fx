#if defined(VERTEXCOLOR) || defined(INSTANCESCOLOR)
    vColor = vec4(1.0);
    #ifdef VERTEXCOLOR
        vColor *= color;
    #endif
    #ifdef INSTANCESCOLOR
        vColor *= instanceColor;
    #endif
#endif