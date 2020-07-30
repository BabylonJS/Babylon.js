// This file contains native only extensions for WebXR  These APIs are not supported in the browser yet.
// They are intended for use with either Babylon Native https://github.com/BabylonJS/BabylonNative or
// Babylon React Native: https://github.com/BabylonJS/BabylonReactNative

interface XRSession {
    setFeaturePointCloudEnabled(enabled: boolean): boolean;
}

interface XRFrame {
    featurePointCloud? : Array<number>;
}