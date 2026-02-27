var ambient_occlusion: vec3f = vec3f(1.0f, 1.0f, 1.0f);
var specular_ambient_occlusion: f32 = 1.0f;
var coat_specular_ambient_occlusion: f32 = 1.0f;

#ifdef AMBIENT_OCCLUSION
    var ambientOcclusionFromTexture: vec3f = textureSample(ambientOcclusionSampler, ambientOcclusionSamplerSampler, fragmentInputs.vAmbientOcclusionUV + uvOffset).rgb;
    ambient_occlusion = vec3f(ambientOcclusionFromTexture.r * uniforms.vAmbientOcclusionInfos.y + (1.0f - uniforms.vAmbientOcclusionInfos.y));
#endif