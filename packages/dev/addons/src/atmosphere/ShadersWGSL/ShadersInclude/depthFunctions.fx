// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

// Assumes infinite far plane (camera.maxZ = 0), forward depth (non-reversed).
fn reconstructDistanceFromCameraPlane(depth: f32, cameraNearPlane: f32) -> f32 {
    return cameraNearPlane / (1. - depth);
}

// If depth is at far plane, returns 0.
fn sampleDistanceFromCameraPlane(depthTex: texture_2d<f32>, depthSampler: sampler, uv: vec2f, cameraNearPlane: f32) -> f32 {
    let depth = textureSampleLevel(depthTex, depthSampler, uv, 0.).r;
    return select(reconstructDistanceFromCameraPlane(depth, cameraNearPlane), 0., depth >= 1.);
}

// Assumes infinite far plane (camera.maxZ = 0), forward depth (non-reversed).
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
    return select(reconstructDistanceFromCamera(depth, cameraRayDirection, cameraForward, cameraNearPlane), 0., depth >= 1.);
}
