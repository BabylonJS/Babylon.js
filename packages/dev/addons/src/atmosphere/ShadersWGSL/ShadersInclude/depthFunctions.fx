// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

// Comparison here varies depending on depth direction.
fn isAtOrBeyondFarPlane(depth: f32) -> bool {
    #if USE_REVERSE_DEPTHBUFFER
    return depth <= 0.;
    #else
    return depth >= 1.;
    #endif
}

// Assumes infinite far plane (camera.maxZ = 0).
fn reconstructDistanceFromCameraPlane(depth: f32, cameraNearPlane: f32) -> f32 {
    #if USE_REVERSE_DEPTHBUFFER
    return cameraNearPlane / depth;
    #else
    return cameraNearPlane / (1. - depth);
    #endif
}

// If depth is at far plane, returns 0.
fn sampleDistanceFromCameraPlane(depthTex: texture_2d<f32>, depthSampler: sampler, uv: vec2f, cameraNearPlane: f32) -> f32 {
    let depth = textureSampleLevel(depthTex, depthSampler, uv, 0.).r;
    if (isAtOrBeyondFarPlane(depth)) {
        return 0.;
    }
    return reconstructDistanceFromCameraPlane(depth, cameraNearPlane);
}

// Assumes infinite far plane (camera.maxZ = 0).
fn reconstructDistanceFromCamera(depth: f32, cameraRayDirection: vec3f, cameraForward: vec3f, cameraNearPlane: f32) -> f32 {
    let distanceFromCameraPlane = reconstructDistanceFromCameraPlane(depth, cameraNearPlane);
    return distanceFromCameraPlane / max(.00001, dot(cameraForward, cameraRayDirection));
}

// If depth is at far plane, returns 0.
fn reconstructDistanceFromCameraWithTexture(
    depthTex: texture_2d<f32>,
    depthSampler: sampler,
    uv: vec2f,
    cameraRayDirection: vec3f,
    cameraForward: vec3f,
    cameraNearPlane: f32) -> f32 {
    let depth = textureSampleLevel(depthTex, depthSampler, uv, 0.).r;
    if (isAtOrBeyondFarPlane(depth)) {
        return 0.;
    }
    return reconstructDistanceFromCamera(depth, cameraRayDirection, cameraForward, cameraNearPlane);
}
