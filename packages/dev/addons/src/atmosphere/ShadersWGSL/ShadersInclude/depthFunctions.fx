// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

// Assumes infinite far plane (camera.maxZ = 0), forward depth (non-reversed).
fn reconstructDistanceFromCameraPlane(depth: f32, cameraNearPlane: f32) -> f32 {
    return cameraNearPlane / (1. - depth);
}

// Assumes infinite far plane (camera.maxZ = 0), forward depth (non-reversed).
fn reconstructDistanceFromCamera(depth: f32, cameraRayDirection: vec3f, cameraForward: vec3f, cameraNearPlane: f32) -> f32 {
    let distanceFromCameraPlane = reconstructDistanceFromCameraPlane(depth, cameraNearPlane);
    return distanceFromCameraPlane / max(.00001, dot(cameraForward, cameraRayDirection));
}
