#if SCENE_MRT_COUNT > {X}
    #if defined(PREPASS_MESH_BLEND_TAG) && PREPASS_MESH_BLEND_TAG_INDEX == {X}
        fragmentOutputs.fragData{X} = meshBlendTagOutput;
    #else
        fragmentOutputs.fragData{X} = fragData[{X}];
    #endif
#endif
