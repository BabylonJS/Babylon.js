// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

// Comparison here varies depending on depth direction.
bool isAtOrBeyondFarPlane(float depth) {
    #if USE_REVERSE_DEPTHBUFFER
    return depth <= 0.;
    #else
    return depth >= 1.;
    #endif
}

// Assumes infinite far plane (camera.maxZ = 0).
float reconstructDistanceFromCameraPlane(float depth, float cameraNearPlane) {
    #if USE_REVERSE_DEPTHBUFFER
    return cameraNearPlane / depth;
    #else
    return cameraNearPlane / (1. - depth);
    #endif
}

// If depth is at far plane, returns 0.
float sampleDistanceFromCameraPlane(sampler2D depthTexture, vec2 uv, float cameraNearPlane) {
    float depth = textureLod(depthTexture, uv, 0.).r;
    return isAtOrBeyondFarPlane(depth) ? 0. : reconstructDistanceFromCameraPlane(depth, cameraNearPlane);
}

// Assumes infinite far plane (camera.maxZ = 0).
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
    return isAtOrBeyondFarPlane(depth) ? 0. : reconstructDistanceFromCamera(depth, cameraRayDirection, cameraForward, cameraNearPlane);
}