layout(std140, column_major) uniform;

uniform Material {
    vec2 vTangentSpaceParams;
    vec4 vLightingIntensity;
    float pointSize;

    vec2 vDebugMode;

    vec4 cameraInfo;
    mat4 backgroundRefractionMatrix;
    vec3 vBackgroundRefractionInfos;

    vec2 vReflectionInfos;
    mat4 reflectionMatrix;
    vec3 vReflectionMicrosurfaceInfos;
    vec3 vReflectionPosition;
    vec3 vReflectionSize;
    vec2 vReflectionFilteringInfo;
    vec3 vReflectionDominantDirection;
    vec3 vReflectionColor;
    
    vec3 vSphericalL00;
    vec3 vSphericalL1_1;
    vec3 vSphericalL10;
    vec3 vSphericalL11;
    vec3 vSphericalL2_2;
    vec3 vSphericalL2_1;
    vec3 vSphericalL20;
    vec3 vSphericalL21;
    vec3 vSphericalL22;

    vec3 vSphericalX;
    vec3 vSphericalY;
    vec3 vSphericalZ;
    vec3 vSphericalXX_ZZ;
    vec3 vSphericalYY_ZZ;
    vec3 vSphericalZZ;
    vec3 vSphericalXY;
    vec3 vSphericalYZ;
    vec3 vSphericalZX;

    float vBaseWeight;
    vec4 vBaseColor;
    float vBaseDiffuseRoughness;
    vec4 vReflectanceInfo;
    vec4 vSpecularColor;
    vec3 vSpecularAnisotropy;
    float vTransmissionWeight;
    vec3 vTransmissionColor;
    float vTransmissionDepth;
    vec3 vTransmissionScatter;
    float vTransmissionScatterAnisotropy;
    float vTransmissionDispersionScale;
    float vTransmissionDispersionAbbeNumber;
    float vCoatWeight;
    vec3 vCoatColor;
    float vCoatRoughness;
    float vCoatRoughnessAnisotropy;
    float vCoatIor;
    float vCoatDarkening;
    float vFuzzWeight;
    vec3 vFuzzColor;
    float vFuzzRoughness;
    vec2 vGeometryCoatTangent;
    float vGeometryThickness;
    vec3 vEmissionColor;
    float vThinFilmWeight;
    vec2 vThinFilmThickness;
    float vThinFilmIor;

    vec2 vBaseWeightInfos;
    mat4 baseWeightMatrix;
    vec2 vBaseColorInfos;
    mat4 baseColorMatrix;
    vec2 vBaseDiffuseRoughnessInfos;
    mat4 baseDiffuseRoughnessMatrix;
    vec2 vBaseMetalnessInfos;
    mat4 baseMetalnessMatrix;
    vec2 vSpecularWeightInfos;
    mat4 specularWeightMatrix;
    vec2 vSpecularColorInfos;
    mat4 specularColorMatrix;
    vec2 vSpecularRoughnessInfos;
    mat4 specularRoughnessMatrix;
    vec2 vSpecularRoughnessAnisotropyInfos;
    mat4 specularRoughnessAnisotropyMatrix;
    vec2 vTransmissionWeightInfos;
    mat4 transmissionWeightMatrix;
    vec2 vTransmissionColorInfos;
    mat4 transmissionColorMatrix;
    vec2 vTransmissionDepthInfos;
    mat4 transmissionDepthMatrix;
    vec2 vTransmissionScatterInfos;
    mat4 transmissionScatterMatrix;
    vec2 vTransmissionDispersionScaleInfos;
    mat4 transmissionDispersionScaleMatrix;
    vec2 vCoatWeightInfos;
    mat4 coatWeightMatrix;
    vec2 vCoatColorInfos;
    mat4 coatColorMatrix;
    vec2 vCoatRoughnessInfos;
    mat4 coatRoughnessMatrix;
    vec2 vCoatRoughnessAnisotropyInfos;
    mat4 coatRoughnessAnisotropyMatrix;
    vec2 vCoatDarkeningInfos;
    mat4 coatDarkeningMatrix;
    vec2 vFuzzWeightInfos;
    mat4 fuzzWeightMatrix;
    vec2 vFuzzColorInfos;
    mat4 fuzzColorMatrix;
    vec2 vFuzzRoughnessInfos;
    mat4 fuzzRoughnessMatrix;
    vec2 vGeometryNormalInfos;
    mat4 geometryNormalMatrix;
    vec2 vGeometryTangentInfos;
    mat4 geometryTangentMatrix;
    vec2 vGeometryCoatNormalInfos;
    mat4 geometryCoatNormalMatrix;
    vec2 vGeometryCoatTangentInfos;
    mat4 geometryCoatTangentMatrix;
    vec2 vGeometryOpacityInfos;
    mat4 geometryOpacityMatrix;
    vec2 vGeometryThicknessInfos;
    mat4 geometryThicknessMatrix;
    vec2 vEmissionColorInfos;
    mat4 emissionColorMatrix;
    vec2 vThinFilmWeightInfos;
    mat4 thinFilmWeightMatrix;
    vec2 vThinFilmThicknessInfos;
    mat4 thinFilmThicknessMatrix;
    vec2 vAmbientOcclusionInfos;
    mat4 ambientOcclusionMatrix;

#define ADDITIONAL_UBO_DECLARATION
};

#include<sceneUboDeclaration>
#include<meshUboDeclaration>
