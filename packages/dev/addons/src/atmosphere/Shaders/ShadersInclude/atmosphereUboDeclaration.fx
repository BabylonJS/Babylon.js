// Copyright (c) Microsoft Corporation.
// MIT License

layout(std140, column_major) uniform;

uniform Atmosphere {
    vec3 peakRayleighScattering;
    float planetRadius;
    vec3 peakMieScattering;
    float atmosphereThickness;
    vec3 peakMieAbsorption;
    float planetRadiusSquared;
    vec3 peakMieExtinction;
    float atmosphereRadius;
    vec3 peakOzoneAbsorption;
    float atmosphereRadiusSquared;
    float horizonDistanceToAtmosphereEdge;
    float horizonDistanceToAtmosphereEdgeSquared;
    float planetRadiusWithOffset;
    float planetRadiusOffset;
    float atmosphereExposure;
    float aerialPerspectiveRadianceBias;
    float inverseAtmosphereThickness;
    float aerialPerspectiveTransmittanceScale;
    mat4 inverseViewProjectionWithoutTranslation;
    vec3 directionToLight;
    float multiScatteringIntensity;
    vec3 directionToLightRelativeToCameraGeocentricNormal;
    float cameraRadius;
    vec3 lightRadianceAtCamera;
    float diffuseSkyIrradianceDesaturationFactor;
    vec3 groundAlbedo;
    float aerialPerspectiveSaturation;
    vec3 minMultiScattering;
    float diffuseSkyIrradianceIntensity;
    vec3 cameraPositionGlobal;
    float lightIntensity;
    vec3 clampedCameraPositionGlobal;
    float aerialPerspectiveIntensity;
    vec3 cameraGeocentricNormal;
    float clampedCameraRadius;
    vec3 cameraForward;
    float clampedCameraHeight;
    vec3 cameraPosition;
    float cosCameraHorizonAngleFromZenith;
    vec4 viewport;
    vec3 additionalDiffuseSkyIrradiance;
    float cameraHeight;
    float cameraNearPlane;
    float originHeight;
    float sinCameraAtmosphereHorizonAngleFromNadir;
};
