/* eslint-disable babylonjs/available */
/* eslint-disable @typescript-eslint/naming-convention */
// Ambient declarations for the WebXR/WebGPU binding module.
// The community-maintained webxr.d.ts does not yet include XRGPUBinding and its associated
// types, so they are declared here as a companion (mirroring webxr.nativeextensions.d.ts).
//
// Shapes are grounded in the immersive-web/WebXR-WebGPU-Binding explainer + proposed IDL:
// https://github.com/immersive-web/WebXR-WebGPU-Binding/blob/main/explainer.md
//
// The base XR layer/sub-image types (XRSubImage, XRProjectionLayer, XRQuadLayer, XRCylinderLayer,
// XREquirectLayer, XRCubeLayer, XRCompositionLayer, XRLayerLayout, XRFrame, XRView, XREye,
// XRSpace, XRRigidTransform) come from webxr.d.ts. The WebGPU adapter opt-in
// (GPURequestAdapterOptions.xrCompatible) is declared in webgpu.d.ts and intentionally not
// duplicated here.

// XRGPUSubImage : XRSubImage
interface XRGPUSubImage extends XRSubImage {
    readonly colorTexture: GPUTexture;
    readonly depthStencilTexture?: GPUTexture;
    readonly motionVectorTexture?: GPUTexture;
    getViewDescriptor(): GPUTextureViewDescriptor;
}

declare abstract class XRGPUSubImage implements XRGPUSubImage {}

// dictionary XRGPUProjectionLayerInit
interface XRGPUProjectionLayerInit {
    colorFormat: GPUTextureFormat;
    depthStencilFormat?: GPUTextureFormat;
    // GPUTextureUsage.RENDER_ATTACHMENT (0x10) per spec default.
    textureUsage?: GPUTextureUsageFlags;
    scaleFactor?: number;
}

// dictionary XRGPULayerInit
interface XRGPULayerInit {
    colorFormat: GPUTextureFormat;
    depthStencilFormat?: GPUTextureFormat;
    // GPUTextureUsage.RENDER_ATTACHMENT (0x10) per spec default.
    textureUsage?: GPUTextureUsageFlags;
    space: XRSpace;
    mipLevels?: number;
    viewPixelWidth: number;
    viewPixelHeight: number;
    layout?: XRLayerLayout;
    isStatic?: boolean;
}

// dictionary XRGPUQuadLayerInit : XRGPULayerInit
interface XRGPUQuadLayerInit extends XRGPULayerInit {
    transform?: XRRigidTransform;
    width?: number;
    height?: number;
}

// dictionary XRGPUCylinderLayerInit : XRGPULayerInit
interface XRGPUCylinderLayerInit extends XRGPULayerInit {
    transform?: XRRigidTransform;
    radius?: number;
    centralAngle?: number;
    aspectRatio?: number;
}

// dictionary XRGPUEquirectLayerInit : XRGPULayerInit
interface XRGPUEquirectLayerInit extends XRGPULayerInit {
    transform?: XRRigidTransform;
    radius?: number;
    centralHorizontalAngle?: number;
    upperVerticalAngle?: number;
    lowerVerticalAngle?: number;
}

// dictionary XRGPUCubeLayerInit : XRGPULayerInit
interface XRGPUCubeLayerInit extends XRGPULayerInit {
    orientation?: DOMPointReadOnly;
}

// [Exposed=Window] interface XRGPUBinding
declare class XRGPUBinding {
    constructor(session: XRSession, device: GPUDevice);

    readonly nativeProjectionScaleFactor: number;

    createProjectionLayer(init?: XRGPUProjectionLayerInit): XRProjectionLayer;
    createQuadLayer(init?: XRGPUQuadLayerInit): XRQuadLayer;
    createCylinderLayer(init?: XRGPUCylinderLayerInit): XRCylinderLayer;
    createEquirectLayer(init?: XRGPUEquirectLayerInit): XREquirectLayer;
    createCubeLayer(init?: XRGPUCubeLayerInit): XRCubeLayer;

    getSubImage(layer: XRCompositionLayer, frame: XRFrame, eye?: XREye): XRGPUSubImage;
    getViewSubImage(layer: XRProjectionLayer, view: XRView): XRGPUSubImage;

    getPreferredColorFormat(): GPUTextureFormat;
}
