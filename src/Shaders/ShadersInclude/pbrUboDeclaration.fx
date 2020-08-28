layout(std140, column_major) uniform;

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
    uniform vec2 vReflectionFilteringInfo;
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

    uniform float visibility;

    uniform vec4 vMetallicReflectanceFactors;
    uniform vec2 vMetallicReflectanceInfos;
    uniform mat4 metallicReflectanceMatrix;

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
    uniform float vSheenRoughness;
    uniform vec2 vSheenInfos;
    uniform mat4 sheenMatrix;

    uniform vec3 vRefractionMicrosurfaceInfos;
    uniform vec2 vRefractionFilteringInfo;
    uniform vec4 vRefractionInfos;
    uniform mat4 refractionMatrix;
    uniform vec2 vThicknessInfos;
    uniform mat4 thicknessMatrix;
    uniform vec2 vThicknessParam;
    uniform vec3 vDiffusionDistance;
    uniform vec4 vTintColor;
    uniform vec3 vSubSurfaceIntensity;
    uniform float scatteringDiffusionProfile;

    uniform vec4 vDetailInfos;
    uniform mat4 detailMatrix;

    uniform mat4 previousWorld;
    uniform mat4 previousViewProjection;
};

uniform Scene {
    mat4 viewProjection;
#ifdef MULTIVIEW
	mat4 viewProjectionR;
#endif 
    mat4 view;
};