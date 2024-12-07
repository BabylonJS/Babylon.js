#ifdef FOG
#ifdef SCENE_UBO
    vertexOutputs.vFogDistance = (scene.view * worldPos).xyz;
#else
    vertexOutputs.vFogDistance = (uniforms.view * worldPos).xyz;
#endif
#endif
