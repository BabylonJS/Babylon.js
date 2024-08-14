#if defined(VERTEXCOLOR) || defined(INSTANCESCOLOR) && defined(INSTANCES)
    vertexOutputs.vColor = vec4f(1.0);
    #ifdef VERTEXCOLOR
        #ifdef VERTEXALPHA
            vertexOutputs.vColor *= vertexInputs.color;
        #else
            vertexOutputs.vColor = vec4f(vertexOutputs.vColor.rgb * vertexInputs.color.rgb, vertexOutputs.vColor.a);
        #endif
    #endif

    #ifdef INSTANCESCOLOR
        vertexOutputs.vColor *= vertexInputs.instanceColor;
    #endif
#endif