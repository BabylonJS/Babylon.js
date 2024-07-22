// _____________________________ Diffuse ________________________________________
var finalDiffuse: vec3f = diffuseBase;
finalDiffuse *= surfaceAlbedo.rgb;
finalDiffuse = max(finalDiffuse, vec3f(0.0));
finalDiffuse *= vLightingIntensity.x;

// _____________________________ Ambient ________________________________________
var finalAmbient: vec3f = vAmbientColor;
finalAmbient *= surfaceAlbedo.rgb;

// _____________________________ Emissive ________________________________________
var finalEmissive: vec3f = vEmissiveColor;
#ifdef EMISSIVE
var emissiveColorTex: vec3f = texture2D(emissiveSampler, vEmissiveUV + uvOffset).rgb;
#ifdef GAMMAEMISSIVE
    finalEmissive *= toLinearSpace(emissiveColorTex.rgb);
#else
    finalEmissive *= emissiveColorTex.rgb;
#endif
finalEmissive *=  vEmissiveInfos.y;
#endif
finalEmissive *= vLightingIntensity.y;

// ______________________________ Ambient ________________________________________
#ifdef AMBIENT
var ambientOcclusionForDirectDiffuse: vec3f = mix( vec3f(1.), aoOut.ambientOcclusionColor, vAmbientInfos.w);
#else
var ambientOcclusionForDirectDiffuse: vec3f = aoOut.ambientOcclusionColor;
#endif

finalAmbient *= aoOut.ambientOcclusionColor;
finalDiffuse *= ambientOcclusionForDirectDiffuse;
