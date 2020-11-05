// This file contains native only extensions for WebXR. These APIs are not supported in the browser yet.
// They are intended for use with either Babylon Native https://github.com/BabylonJS/BabylonNative or
// Babylon React Native: https://github.com/BabylonJS/BabylonReactNative

type XRGeometryType = "unknown" | "background" | "wall" | "floor" | "ceiling" | "platform";

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
    // Open question: Should parent geometry id's and types be declared on XRPlanes or queried through other means?
    parentGeometryId?: number;
    parentGeometryType?: XRWorldGeometryType;
}

interface XRMesh {
    meshSpace: XRSpace;
    positions: Float32Array;
    indices: Uint32Array;
    normals?: Float32Array;
    lastChangedTime: number;

    // Open question: Should parent geometry id's and types be declared on XRMeshes or queried through other means?
    parentGeometryId?: number;
    parentGeometryType?: XRGeometryType;
}

type XRDetectionBoundaryType = "frustum" | "sphere" | "box";

interface XRDetectionBoundary {
    type: XRDetectionBoundaryType;
}

interface XRFrustumDetectionBoundary extends XRDetectionBoundary {
    type: XRDetectionBoundaryType = "frustum"
    frustum: XRFrustum;
}

interface XRSphereDetectionBoundary extends XRDetectionBoundary {
    type: XRDetectionBoundaryType = "sphere";
    radius: number;
}

interface XRBoxDetectionBoundary extends XRDetectionBoundary {
    type: XRDetectionBoundaryType = "box";
    extent: DOMPointReadOnly;
}

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
    featurePointCloud? : Array<number>;
}

type XRMeshSet = Set<XRMesh>;

interface XRWorldInformation {
    detectedMeshes? : XRMeshSet;
}