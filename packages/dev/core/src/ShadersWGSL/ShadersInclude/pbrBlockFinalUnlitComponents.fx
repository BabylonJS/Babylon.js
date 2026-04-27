// _____________________________ Diffuse ________________________________________
var finalDiffuse: vec3f = diffuseBase;
finalDiffuse *= surfaceAlbedo;
#if defined(SS_REFRACTION) && !defined(UNLIT) && !defined(LEGACY_SPECULAR_ENERGY_CONSERVATION)
    finalDiffuse *= subSurfaceOut.refractionOpacity;
#endif
#if defined(SS_TRANSLUCENCY) && !defined(UNLIT)
    finalDiffuse += diffuseTransmissionBase;
#endif
finalDiffuse = max(finalDiffuse, vec3f(0.0));
finalDiffuse *= uniforms.vLightingIntensity.x;

// _____________________________ Ambient ________________________________________
var finalAmbient: vec3f = uniforms.vAmbientColor;
finalAmbient = finalAmbient * surfaceAlbedo.rgb;

// _____________________________ Emissive ________________________________________
var finalEmissive: vec3f = uniforms.vEmissiveColor;
#ifdef EMISSIVE
var emissiveColorTex: vec3f = textureSample(emissiveSampler, emissiveSamplerSampler, fragmentInputs.vEmissiveUV + uvOffset).rgb;
#ifdef GAMMAEMISSIVE
    finalEmissive *= toLinearSpaceVec3(emissiveColorTex.rgb);
#else
    finalEmissive *= emissiveColorTex.rgb;
#endif
finalEmissive *=  uniforms.vEmissiveInfos.y;
#endif
finalEmissive *= uniforms.vLightingIntensity.y;

// ______________________________ Ambient ________________________________________
#ifdef AMBIENT
var ambientOcclusionForDirectDiffuse: vec3f = mix( vec3f(1.), aoOut.ambientOcclusionColor, uniforms.vAmbientInfos.w);
#else
var ambientOcclusionForDirectDiffuse: vec3f = aoOut.ambientOcclusionColor;
#endif

finalAmbient *= aoOut.ambientOcclusionColor;
finalDiffuse *= ambientOcclusionForDirectDiffuse;
