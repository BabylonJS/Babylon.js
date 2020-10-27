// This file contains native only extensions for WebXR  These APIs are not supported in the browser yet.
// They are intended for use with either Babylon Native https://github.com/BabylonJS/BabylonNative or
// Babylon React Native: https://github.com/BabylonJS/BabylonReactNative

interface XRVector {
    x: number;
    y: number;
    z: number;
}

interface XRQuaternion {
    x: number;
    y: number;
    z: number;
    w: number;
}

interface XRFieldOfView {
    angleLeft: number;
    angleRight: number;
    angleUp: number;
    angleDown: number;
}

interface XRFrustum {
    position: XRVector;
    rotation: XRQuaternion;
    fieldOfView: XRFieldOfView;
    farDistance: number;
}

interface XRMesh {
    positions: Float32Array;
    indices: Uint32Array;
    normals?: Float32Array;
    transformationMatrix?: Matrix;
    lastChangedTime: number;
}

type XRGeometryType = "unknown" | "background" | "wall" | "floor" | "ceiling" | "platform";

type XRDetectionBoundaryType = "frustum" | "sphere" | "box";

interface XRDetectionBoundary {
    isStationary?: boolean;
    type?: XRDetectionBoundaryType | string;
    frustum?: XRFrustum;
    sphereRadius?: number;
    boxDimensions?: XRVector;
}

type XRGeometryLevelOfDetail = "coarse" | "medium" | "fine" | "custom";

interface XRGeometryDetectorOptions {
    detectionBoundary?: XRDetectionBoundary;
    levelOfDetail?: XRGeometryLevelOfDetail | string;
    updateInterval?: number;
}

interface XRSession {
    trySetFeaturePointCloudEnabled(enabled: boolean): boolean;
    trySetPlaneDetectorOptions(options: XRGeometryDetectorOptions): boolean;
    tryGetPlaneGeometryId(xrPlane: XRPlane): number | undefined;
    tryGetPlaneGeometryType(xrPlane: XRPlane): XRGeometryType | string | undefined;
    trySetMeshDetectorEnabled(enabled: boolean): boolean;
    trySetMeshDetectorOptions(options: XRGeometryDetectorOptions): boolean;
    tryGetMeshGeometryId(xrMesh: XRMesh): number | undefined;
    tryGetMeshGeometryType(xrMesh: XRMesh): XRGeometryType | string | undefined;
}

type XRMeshSet = Set<XRMesh>;

interface XRFrame {
    featurePointCloud? : Array<number>;
    detectedMeshes? : XRMeshSet;
}