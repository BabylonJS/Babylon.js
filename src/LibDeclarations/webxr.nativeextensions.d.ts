// This file contains native only extensions for WebXR. These APIs are not supported in the browser yet.
// They are intended for use with either Babylon Native https://github.com/BabylonJS/BabylonNative or
// Babylon React Native: https://github.com/BabylonJS/BabylonReactNative

// Open question: Do better types exist to use for vectors/quaternions?
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

// Open question: Should XRGeometryType be defined or should all types be strings?
type XRGeometryType = "unknown" | "background" | "wall" | "floor" | "ceiling" | "platform";

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

interface XRPlane {
    // Open question: Should geometry id's and types be declared on XRPlanes or queried through other means?
    geometryId?: number;
    geometryType?: XRGeometryType | string;
}

// Open question: Should XRMesh have a concept of a XRReferenceSpace similar to XRPlane?
interface XRMesh {
    positions: Float32Array;
    indices: Uint32Array;
    normals?: Float32Array;
    // Open question: Do we need lastChangedTime declared for XRMeshes?
    lastChangedTime: number;
    // Open question: Should geometry id's and types be declared on XRMeshes or queried through other means?
    geometryId?: number;
    geometryType?: XRGeometryType | string;
}

type XRDetectionBoundaryType = "frustum" | "sphere" | "box";

interface XRDetectionBoundary {
    isStationary?: boolean;
    type?: XRDetectionBoundaryType;
    frustum?: XRFrustum;
    sphereRadius?: number;
    boxDimensions?: XRVector;
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

type XRMeshSet = Set<XRMesh>;

interface XRFrame {
    featurePointCloud? : Array<number>;
    // Open question: Should meshes be declared on the XRFrame or queried for the session?
    detectedMeshes? : XRMeshSet;
}