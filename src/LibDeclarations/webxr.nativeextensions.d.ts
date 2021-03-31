// This file contains native only extensions for WebXR. These APIs are not supported in the browser yet.
// They are intended for use with either Babylon Native https://github.com/BabylonJS/BabylonNative or
// Babylon React Native: https://github.com/BabylonJS/BabylonReactNative

type XRSceneObjectType = "unknown" | "background" | "wall" | "floor" | "ceiling" | "platform" | "inferred" | "world";

interface XRSceneObject {
    type: XRSceneObjectType;
}

interface XRFieldOfView {
    angleLeft: number;
    angleRight: number;
    angleUp: number;
    angleDown: number;
}

interface XRFrustum {
    position: DOMPointReadOnly;
    orientation: DOMPointReadOnly;
    fieldOfView: XRFieldOfView;
    farDistance: number;
}

interface XRPlane {
    parentSceneObject?: XRSceneObject;
}

interface XRMesh {
    meshSpace: XRSpace;
    positions: Float32Array;
    indices: Uint32Array;
    normals?: Float32Array;
    lastChangedTime: number;
    parentSceneObject?: XRSceneObject;
}

interface XRFrustumDetectionBoundary {
    type: "frustum";
    frustum: XRFrustum;
}

interface XRSphereDetectionBoundary {
    type: "sphere";
    radius: number;
}

interface XRBoxDetectionBoundary {
    type: "box";
    extent: DOMPointReadOnly;
}

type XRDetectionBoundary = XRFrustumDetectionBoundary | XRSphereDetectionBoundary | XRBoxDetectionBoundary;

interface XRGeometryDetectorOptions {
    detectionBoundary?: XRDetectionBoundary;
    updateInterval?: number;
}

interface XRSession {
    trySetFeaturePointCloudEnabled(enabled: boolean): boolean;
    trySetPreferredPlaneDetectorOptions(preferredOptions: XRGeometryDetectorOptions): boolean;
    trySetMeshDetectorEnabled(enabled: boolean): boolean;
    trySetPreferredMeshDetectorOptions(preferredOptions: XRGeometryDetectorOptions): boolean;
}

interface XRFrame {
    featurePointCloud?: Array<number>;
}

type XRMeshSet = Set<XRMesh>;

interface XRWorldInformation {
    detectedMeshes?: XRMeshSet;
}