layout(std140, column_major) uniform;

// layout(set = 0, binding = 0) uniform Harmonics
// {
//     uniform vec3 vSphericalL00;
//     uniform vec3 vSphericalL1_1;
//     uniform vec3 vSphericalL10;
//     uniform vec3 vSphericalL11;
//     uniform vec3 vSphericalL2_2;
//     uniform vec3 vSphericalL2_1;
//     uniform vec3 vSphericalL20;
//     uniform vec3 vSphericalL21;
//     uniform vec3 vSphericalL22;

//     uniform vec3 vSphericalX;
//     uniform vec3 vSphericalY;
//     uniform vec3 vSphericalZ;
//     uniform vec3 vSphericalXX_ZZ;
//     uniform vec3 vSphericalYY_ZZ;
//     uniform vec3 vSphericalZZ;
//     uniform vec3 vSphericalXY;
//     uniform vec3 vSphericalYZ;
//     uniform vec3 vSphericalZX;
// }

#ifdef WEBGPU
layout(set = 0, binding = 0) 
#endif
uniform Scene {
    mat4 viewProjection;
#ifdef MULTIVIEW
	mat4 viewProjectionR;
#endif 
    mat4 view;
};

#ifdef WEBGPU
layout(set = 1, binding = 0) 
#endif
uniform Material
{
    uniform vec2 vAlbedoInfos;
    uniform vec4 vAmbientInfos;
    uniform vec2 vOpacityInfos;
    uniform vec2 vEmissiveInfos;
    uniform vec2 vLightmapInfos;
    uniform vec3 vReflectivityInfos;
    uniform vec2 vMicroSurfaceSamplerInfos;
    uniform vec2 vReflectionInfos;
    uniform vec3 vReflectionPosition;
    uniform vec3 vReflectionSize;
    uniform vec3 vBumpInfos;
    uniform mat4 albedoMatrix;
    uniform mat4 ambientMatrix;
    uniform mat4 opacityMatrix;
    uniform mat4 emissiveMatrix;
    uniform mat4 lightmapMatrix;
    uniform mat4 reflectivityMatrix;
    uniform mat4 microSurfaceSamplerMatrix;
    uniform mat4 bumpMatrix;
    uniform vec2 vTangentSpaceParams;
    uniform mat4 reflectionMatrix;
    uniform vec3 vReflectionColor;
    uniform vec4 vAlbedoColor;
    uniform vec4 vLightingIntensity;
    uniform vec3 vReflectionMicrosurfaceInfos;
    uniform float pointSize;
    uniform vec4 vReflectivityColor;
    uniform vec3 vEmissiveColor;
    uniform vec4 vEyePosition;
    uniform vec3 vAmbientColor;

    uniform vec2 vDebugMode;

    uniform vec2 vClearCoatParams;
    uniform vec4 vClearCoatRefractionParams;
    uniform vec2 vClearCoatInfos;
    uniform mat4 clearCoatMatrix;
    uniform vec2 vClearCoatBumpInfos;
    uniform vec2 vClearCoatTangentSpaceParams;
    uniform mat4 clearCoatBumpMatrix;
    uniform vec4 vClearCoatTintParams;
    uniform float clearCoatColorAtDistance;
    uniform vec2 vClearCoatTintInfos;
    uniform mat4 clearCoatTintMatrix;

    uniform vec3 vAnisotropy;
    uniform vec2 vAnisotropyInfos;
    uniform mat4 anisotropyMatrix;

    uniform vec4 vSheenColor;
    uniform vec2 vSheenInfos;
    uniform mat4 sheenMatrix;

    uniform vec3 vRefractionMicrosurfaceInfos;
    uniform vec4 vRefractionInfos;
    uniform mat4 refractionMatrix;
    uniform vec2 vThicknessInfos;
    uniform mat4 thicknessMatrix;
    uniform vec2 vThicknessParam;
    uniform vec3 vDiffusionDistance;
    uniform vec4 vTintColor;
    uniform vec3 vSubSurfaceIntensity;

    uniform vec3 vSphericalL00;
    uniform vec3 vSphericalL1_1;
    uniform vec3 vSphericalL10;
    uniform vec3 vSphericalL11;
    uniform vec3 vSphericalL2_2;
    uniform vec3 vSphericalL2_1;
    uniform vec3 vSphericalL20;
    uniform vec3 vSphericalL21;
    uniform vec3 vSphericalL22;

    uniform vec3 vSphericalX;
    uniform vec3 vSphericalY;
    uniform vec3 vSphericalZ;
    uniform vec3 vSphericalXX_ZZ;
    uniform vec3 vSphericalYY_ZZ;
    uniform vec3 vSphericalZZ;
    uniform vec3 vSphericalXY;
    uniform vec3 vSphericalYZ;
    uniform vec3 vSphericalZX;
};

#ifdef WEBGPU
layout(set = 2, binding = 0) 
#endif
uniform Mesh {
    mat4 world;
    float visibility;
};