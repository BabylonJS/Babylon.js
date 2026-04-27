// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

// Assumes infinite far plane (camera.maxZ = 0), forward depth (non-reversed).
float reconstructDistanceFromCameraPlane(float depth, float cameraNearPlane) {
    return cameraNearPlane / (1. - depth);
}

// If depth is at far plane, returns 0.
float sampleDistanceFromCameraPlane(sampler2D depthTexture, vec2 uv, float cameraNearPlane) {
    float depth = textureLod(depthTexture, uv, 0.).r;
    return depth >= 1. ? 0. : reconstructDistanceFromCameraPlane(depth, cameraNearPlane);
}

// Assumes infinite far plane (camera.maxZ = 0), forward depth (non-reversed).
float reconstructDistanceFromCamera(float depth, vec3 cameraRayDirection, vec3 cameraForward, float cameraNearPlane) {
    float distanceFromCameraPlane = reconstructDistanceFromCameraPlane(depth, cameraNearPlane);
    return distanceFromCameraPlane / max(0.00001, dot(cameraForward, cameraRayDirection));
}

// If depth is at far plane, returns 0.
float reconstructDistanceFromCamera(
    sampler2D depthTexture,
    vec2 uv,
    vec3 cameraRayDirection,
    vec3 cameraForward,
    float cameraNearPlane) {
    float depth = textureLod(depthTexture, uv, 0.).r;
    return depth >= 1. ? 0. : reconstructDistanceFromCamera(depth, cameraRayDirection, cameraForward, cameraNearPlane);
}