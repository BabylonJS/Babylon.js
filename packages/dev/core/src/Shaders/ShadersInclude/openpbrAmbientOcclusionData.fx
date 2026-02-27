vec3 ambient_occlusion = vec3(1.0);
float specular_ambient_occlusion = 1.0;
float coat_specular_ambient_occlusion = 1.0;

#ifdef AMBIENT_OCCLUSION
    vec3 ambientOcclusionFromTexture = texture2D(ambientOcclusionSampler, vAmbientOcclusionUV + uvOffset).rgb;
    ambient_occlusion = vec3(ambientOcclusionFromTexture.r * vAmbientOcclusionInfos.y + (1.0 - vAmbientOcclusionInfos.y));
#endif